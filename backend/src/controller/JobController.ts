import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Job, JobStatus } from "../entity/Job";
import { User, UserRole } from "../entity/User";
import { EmailService } from "../service/EmailService";
import { Notification, NotificationType } from "../entity/Notification";

export class JobController {
  static async create(req: Request, res: Response) {
    const { title, description, start_date, expected_closing_date, department, branch, tags, assigneeIds } = req.body;
    // @ts-ignore
    const user = req.user;

    if (!title || !description || !expected_closing_date) {
      return res.status(400).json({ message: "Title, description, and expected closing date are required" });
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const userRepository = AppDataSource.getRepository(User);

    const creator = await userRepository.findOne({ where: { id: user.userId } });
    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only Admin, HR, and Engineering Manager can create jobs
    if (creator.role === UserRole.RECRUITER) {
      return res.status(403).json({ message: "Recruiters are not allowed to create jobs" });
    }

    // Validate dates
    const startDate = start_date ? new Date(start_date) : new Date();
    const expectedClosingDate = new Date(expected_closing_date);

    if (expectedClosingDate <= startDate) {
      return res.status(400).json({ message: "Expected closing date must be after start date" });
    }

    // Prepare assignees list
    let assignees = [creator]; // Creator is automatically assigned
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      const additionalAssignees = await userRepository.findByIds(assigneeIds);
      // Add additional assignees, avoiding duplicates
      const creatorId = creator.id;
      const uniqueAssignees = additionalAssignees.filter(a => a.id !== creatorId);
      assignees = [creator, ...uniqueAssignees];
    }

    const job = new Job();
    job.title = title;
    job.description = description;
    job.department = department;
    job.branch = branch;
    job.tags = tags;
    job.start_date = startDate;
    job.expected_closing_date = expectedClosingDate;
    job.created_by = creator;
    job.assignees = assignees;

    try {
      await jobRepository.save(job);
      
      // Send email notifications to newly assigned recruiters (excluding creator)
      const recruitersToNotify = assignees.filter(a => a.id !== creator.id);
      const notificationRepository = AppDataSource.getRepository(Notification);
      recruitersToNotify.forEach(async recruiter => {
        EmailService.notifyJobAssignment(recruiter.email, job.title, job.description, startDate, expectedClosingDate);
        
        // Create notification
        const notification = new Notification();
        notification.user = recruiter;
        notification.type = NotificationType.JOB_ASSIGNED;
        notification.message = `You have been assigned to a new job: ${job.title}`;
        notification.relatedEntityId = parseInt(job.id as any) || 0;
        await notificationRepository.save(notification);
      });
      
      return res.status(201).json(job);
    } catch (error) {
      return res.status(500).json({ message: "Error creating job", error });
    }
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const { title, description, expected_closing_date, department, branch, tags } = req.body;
    
    const jobRepository = AppDataSource.getRepository(Job);
    
    try {
      const job = await jobRepository.findOne({ 
        where: { id: id as string },
        relations: ["created_by", "assignees", "candidates"]
      });
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status === JobStatus.CLOSED) {
        return res.status(400).json({ message: "Cannot update closed job" });
      }

      if (title) job.title = title;
      if (description) job.description = description;
      if (department) job.department = department;
      if (branch) job.branch = branch;
      if (tags) job.tags = tags;
      if (expected_closing_date) {
        const newExpectedClosingDate = new Date(expected_closing_date);
        const jobStartDate = job.start_date ? new Date(job.start_date) : new Date();
        if (newExpectedClosingDate <= jobStartDate) {
          return res.status(400).json({ message: "Expected closing date must be after start date" });
        }
        job.expected_closing_date = newExpectedClosingDate;
      }

      await jobRepository.save(job);
      return res.json(job);
    } catch (error) {
      return res.status(500).json({ message: "Error updating job", error });
    }
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const jobRepository = AppDataSource.getRepository(Job);
    
    try {
      const job = await jobRepository.findOne({ where: { id: id as string } });
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status === JobStatus.CLOSED) {
        return res.status(400).json({ message: "Cannot delete closed job" });
      }

      await jobRepository.remove(job);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Error deleting job", error });
    }
  }

  static async close(req: Request, res: Response) {
    const { id } = req.params;
    const jobRepository = AppDataSource.getRepository(Job);
    
    try {
      const job = await jobRepository.findOne({ 
        where: { id: id as string },
        relations: ["created_by", "assignees", "candidates"]
      });
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status === JobStatus.CLOSED) {
        return res.status(400).json({ message: "Job is already closed" });
      }

      job.status = JobStatus.CLOSED;
      job.actual_closing_date = new Date();

      await jobRepository.save(job);
      return res.json(job);
    } catch (error) {
      return res.status(500).json({ message: "Error closing job", error });
    }
  }

  static async assign(req: Request, res: Response) {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "User IDs array is required" });
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const job = await jobRepository.findOne({
        where: { id: id as string },
        relations: ["assignees", "created_by"]
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const users = await userRepository.findByIds(userIds);
      if (users.length !== userIds.length) {
        return res.status(404).json({ message: "One or more users not found" });
      }

      // Track newly assigned users for email notifications
      const previousAssigneeIds = job.assignees.map(a => a.id);
      const newlyAssignedUsers = users.filter(u => !previousAssigneeIds.includes(u.id));

      job.assignees = users;
      await jobRepository.save(job);

      // Send email notifications to newly assigned users
      const notificationRepository = AppDataSource.getRepository(Notification);
      // Send email notifications to newly assigned users
      newlyAssignedUsers.forEach(async user => {
        const startDate = job.start_date || new Date();
        const expectedClosingDate = job.expected_closing_date || new Date();
        EmailService.notifyJobAssignment(user.email, job.title, job.description, startDate, expectedClosingDate);

        // Create notification
        const notification = new Notification();
        notification.user = user;
        notification.type = NotificationType.JOB_ASSIGNED;
        notification.message = `You have been assigned to a new job: ${job.title}`;
        notification.relatedEntityId = parseInt(job.id as any) || 0;
        await notificationRepository.save(notification);
      });

      return res.json(job);
    } catch (error) {
      return res.status(500).json({ message: "Error assigning users", error });
    }
  }

  static async list(req: Request, res: Response) {
    // @ts-ignore
    const user = req.user;
    const { status } = req.query;
    const jobRepository = AppDataSource.getRepository(Job);
    
    try {
      let jobs;
      
      if (user.role === UserRole.ADMIN || user.role === UserRole.HR) {
        // Admin and HR can see all jobs
        const whereClause: any = {};
        if (status === "active") {
          whereClause.status = JobStatus.OPEN;
        } else if (status === "closed") {
          whereClause.status = JobStatus.CLOSED;
        }
        
        jobs = await jobRepository.find({ 
          where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
          relations: ["created_by", "candidates", "assignees"] 
        });
      } else if (user.role === UserRole.ENGINEERING_MANAGER) {
        // EM can see jobs they created or are assigned to
        const whereClause: any = [
          { created_by: { id: user.userId } },
          { assignees: { id: user.userId } }
        ];
        
        if (status === "active") {
          whereClause[0].status = JobStatus.OPEN;
          whereClause[1].status = JobStatus.OPEN;
        } else if (status === "closed") {
          whereClause[0].status = JobStatus.CLOSED;
          whereClause[1].status = JobStatus.CLOSED;
        }
        
        jobs = await jobRepository.find({
          where: whereClause,
          relations: ["created_by", "candidates", "assignees"]
        });
      } else if (user.role === UserRole.RECRUITER) {
        // Recruiters can only see jobs assigned to them
        const whereClause: any = { assignees: { id: user.userId } };
        
        if (status === "active") {
          whereClause.status = JobStatus.OPEN;
        } else if (status === "closed") {
          whereClause.status = JobStatus.CLOSED;
        }
        
        jobs = await jobRepository.find({
          where: whereClause,
          relations: ["created_by", "candidates", "assignees"]
        });
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching jobs", error });
    }
  }

  static async getOne(req: Request, res: Response) {
    const { id } = req.params;
    const jobRepository = AppDataSource.getRepository(Job);
    try {
      const job = await jobRepository.findOne({ 
        where: { id: id as string },
        relations: ["created_by", "candidates", "assignees"] 
      });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      return res.json(job);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching job", error });
    }
  }
}
