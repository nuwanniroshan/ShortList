import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Candidate, CandidateStatus } from "../entity/Candidate";
import { Comment } from "../entity/Comment";
import { Job } from "../entity/Job";
import { PipelineHistory } from "../entity/PipelineHistory";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import { EmailService } from "../service/EmailService";
import { Notification, NotificationType } from "../entity/Notification";

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });

export class CandidateController {
  static async create(req: Request, res: Response) {
    const { 
      name, 
      first_name,
      last_name,
      email, 
      phone, 
      current_address,
      permanent_address,
      education,
      experience,
      desired_salary,
      referred_by,
      website,
      jobId 
    } = req.body;
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const cvFile = files?.cv?.[0];
    const coverLetterFile = files?.cover_letter?.[0];
    const profilePictureFile = files?.profile_picture?.[0];

    if (!name || !jobId || !cvFile) {
      return res.status(400).json({ message: "Name, jobId, and CV file are required" });
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const candidateRepository = AppDataSource.getRepository(Candidate);

    const job = await jobRepository.findOne({ where: { id: jobId as string } });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Compress profile picture if uploaded
    let compressedProfilePicturePath = null;
    if (profilePictureFile) {
      try {
        const compressedFileName = `compressed-${Date.now()}.jpg`;
        compressedProfilePicturePath = path.join("uploads", compressedFileName);
        
        await sharp(profilePictureFile.path)
          .resize(128, 128, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(compressedProfilePicturePath);
        
        // Delete original file
        fs.unlinkSync(profilePictureFile.path);
      } catch (err) {
        console.error("Failed to compress profile picture:", err);
        compressedProfilePicturePath = profilePictureFile.path;
      }
    }

    const candidate = new Candidate();
    candidate.name = name;
    candidate.first_name = first_name;
    candidate.last_name = last_name;
    candidate.email = email;
    candidate.phone = phone;
    candidate.current_address = current_address;
    candidate.permanent_address = permanent_address;
    candidate.cv_file_path = cvFile.path;
    if (coverLetterFile) candidate.cover_letter_path = coverLetterFile.path;
    if (compressedProfilePicturePath) candidate.profile_picture = compressedProfilePicturePath;
    if (education) candidate.education = JSON.parse(education);
    if (experience) candidate.experience = JSON.parse(experience);
    if (desired_salary) candidate.desired_salary = parseFloat(desired_salary);
    if (referred_by) candidate.referred_by = referred_by;
    if (website) candidate.website = website;
    candidate.job = job;
    candidate.status = CandidateStatus.NEW;
    
    // Track who created the candidate
    // Track who created the candidate
    const user = (req as any).user;
    if (user && user.userId) {
      candidate.created_by = { id: user.userId } as any;
    }

    try {
      await candidateRepository.save(candidate);

      // Notify all assignees of the job
      const jobWithAssignees = await jobRepository.findOne({ where: { id: jobId as string }, relations: ["assignees"] });
      const notificationRepository = AppDataSource.getRepository(Notification);
      if (jobWithAssignees) {
          jobWithAssignees.assignees.forEach(async user => {
              EmailService.notifyCandidateUpload(user.email, candidate.name, job.title);
              
              // Create notification
              const notification = new Notification();
              notification.user = user;
              notification.type = NotificationType.CANDIDATE_ADDED;
              notification.message = `New candidate ${candidate.name} added to ${job.title}`;
              notification.relatedEntityId = parseInt(candidate.id as any) || 0;
              await notificationRepository.save(notification);
          });
      }

      return res.status(201).json(candidate);
    } catch (error) {
      return res.status(500).json({ message: "Error creating candidate", error });
    }
  }

  static async listByJob(req: Request, res: Response) {
    const { jobId } = req.params;
    const candidateRepository = AppDataSource.getRepository(Candidate);
    
    try {
      const candidates = await candidateRepository.find({ 
        where: { job: { id: jobId as string } }
      });
      return res.json(candidates);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching candidates", error });
    }
  }

  static async getAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const candidateRepository = AppDataSource.getRepository(Candidate);

    try {
      const [candidates, total] = await candidateRepository.findAndCount({
        relations: ["job"],
        order: { created_at: "DESC" },
        skip,
        take: limit,
      });

      return res.json({
        data: candidates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching candidates", error });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, interview_date, interview_link } = req.body;

    const candidateRepository = AppDataSource.getRepository(Candidate);
    const pipelineHistoryRepository = AppDataSource.getRepository(PipelineHistory);
    const candidate = await candidateRepository.findOne({ where: { id: id as string }, relations: ["job", "job.assignees"] });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Store old status for history tracking
    const oldStatus = candidate.status;

    candidate.status = status;
    if (interview_date) candidate.interview_date = interview_date;
    if (interview_link) candidate.interview_link = interview_link;

    try {
      await candidateRepository.save(candidate);

      // Create pipeline history record
      if (oldStatus !== status) {
        const pipelineHistory = new PipelineHistory();
        pipelineHistory.candidate = candidate;
        pipelineHistory.old_status = oldStatus;
        pipelineHistory.new_status = status;
        
        // Track who made the change
        const user = (req as any).user;
        if (user && user.userId) {
          // Map JWT payload userId to User entity id
          pipelineHistory.changed_by = { id: user.userId } as any;
        }
        
        await pipelineHistoryRepository.save(pipelineHistory);
      }

      // Notify assignees about status change
      const notificationRepository = AppDataSource.getRepository(Notification);
      candidate.job.assignees.forEach(async user => {
          EmailService.notifyStatusChange(user.email, candidate.name, status, candidate.job.title);
          
          // Create notification
          const notification = new Notification();
          notification.user = user;
          notification.type = NotificationType.STATUS_CHANGE;
          notification.message = `Candidate ${candidate.name} status changed to ${status} in ${candidate.job.title}`;
          notification.relatedEntityId = parseInt(candidate.id as any) || 0;
          await notificationRepository.save(notification);
      });

      return res.json(candidate);
    } catch (error) {
      return res.status(500).json({ message: "Error updating status", error });
    }
  }

  static async getCv(req: Request, res: Response) {
    const { id } = req.params;
    const candidateRepository = AppDataSource.getRepository(Candidate);
    
    try {
      const candidate = await candidateRepository.findOne({ where: { id: id as string } });
      if (!candidate || !candidate.cv_file_path) {
        return res.status(404).json({ message: "CV not found" });
      }

      const filePath = path.resolve(candidate.cv_file_path);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ message: "Error sending file" });
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching CV", error });
    }
  }

  static async getProfilePicture(req: Request, res: Response) {
    const { id } = req.params;
    const candidateRepository = AppDataSource.getRepository(Candidate);
    
    try {
      const candidate = await candidateRepository.findOne({ where: { id: id as string } });
      if (!candidate || !candidate.profile_picture) {
        return res.status(404).json({ message: "Profile picture not found" });
      }

      const filePath = path.resolve(candidate.profile_picture);
      
      // Set aggressive caching headers for faster subsequent loads
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', 'image/jpeg');
      
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ message: "Error sending file" });
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching profile picture", error });
    }
  }

  static async updateNotes(req: Request, res: Response) {
    const { id } = req.params;
    const { notes } = req.body;

    const candidateRepository = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepository.findOne({ where: { id: id as string } });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.notes = notes;

    try {
      await candidateRepository.save(candidate);
      return res.json(candidate);
    } catch (error) {
      return res.status(500).json({ message: "Error updating notes", error });
    }
  }

  static async uploadCv(req: Request, res: Response) {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "CV file is required" });
    }

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.mimetype)) {
      // Delete uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Only PDF, DOC, and DOCX files are allowed" });
    }

    // Validate file size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      // Delete uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "File size must not exceed 6MB" });
    }

    const candidateRepository = AppDataSource.getRepository(Candidate);
    
    try {
      const candidate = await candidateRepository.findOne({ where: { id: id as string } });
      if (!candidate) {
        // Delete uploaded file
        fs.unlinkSync(file.path);
        return res.status(404).json({ message: "Candidate not found" });
      }

      // Delete old CV file if exists
      if (candidate.cv_file_path && fs.existsSync(candidate.cv_file_path)) {
        try {
          fs.unlinkSync(candidate.cv_file_path);
        } catch (err) {
          console.error("Failed to delete old CV file:", err);
        }
      }

      // Update candidate with new CV path
      candidate.cv_file_path = file.path;
      await candidateRepository.save(candidate);

      return res.json({ message: "CV uploaded successfully", candidate });
    } catch (error) {
      // Delete uploaded file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(500).json({ message: "Error uploading CV", error });
    }
  }

  static async delete(req: Request, res: Response) {

    const { id } = req.params;
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const commentRepository = AppDataSource.getRepository(Comment);
    
    try {
      const candidate = await candidateRepository.findOne({ where: { id: id as string } });
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      // Delete all comments associated with this candidate first
      await commentRepository
        .createQueryBuilder()
        .delete()
        .from(Comment)
        .where("candidateId = :candidateId", { candidateId: id })
        .execute();

      // Now delete the candidate
      await candidateRepository.remove(candidate);
      return res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting candidate", error });
    }
  }
}
