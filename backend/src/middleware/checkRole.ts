import { Request, Response, NextFunction } from "express";
import { UserRole } from "../entity/User";
import { AppDataSource } from "../data-source";
import { Job, JobStatus } from "../entity/Job";

export const checkRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;

    if (!user) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (roles.includes(user.role) || user.role === UserRole.ADMIN) {
      next();
    } else {
      res.status(403).send("Forbidden");
    }
  };
};

export const checkJobOwnership = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;
    const jobId = req.params.id;

    if (!user) {
        res.status(401).send("Unauthorized");
        return;
    }

    if (user.role === UserRole.ADMIN) {
        next();
        return;
    }

    if (!jobId) {
        res.status(400).send("Job ID required");
        return;
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
        where: { id: jobId },
        relations: ["created_by"]
    });

    if (!job) {
        res.status(404).send("Job not found");
        return;
    }

    if (job.created_by.id === user.userId) {
        next();
    } else {
        res.status(403).send("Forbidden: You are not the owner of this job");
    }
};

export const checkJobAssignment = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;
    const jobId = req.params.id || req.params.jobId || req.body.jobId;

    if (!user) {
        res.status(401).send("Unauthorized");
        return;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.HR) {
        next();
        return;
    }

    if (!jobId) {
        res.status(400).send("Job ID required");
        return;
    }

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
        where: { id: jobId },
        relations: ["assignees", "created_by"]
    });

    if (!job) {
        res.status(404).send("Job not found");
        return;
    }

    const isAssigned = job.assignees.some(assignee => assignee.id === user.userId) || job.created_by.id === user.userId;

    if (isAssigned) {
        next();
    } else {
        res.status(403).send("Forbidden: You are not assigned to this job");
    }
};

export const checkJobNotClosed = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;
    const jobId = req.params.jobId || req.body.jobId;
    const candidateId = req.params.id || req.params.candidateId;

    if (!user) {
        res.status(401).send("Unauthorized");
        return;
    }

    let job: Job | null = null;
    const jobRepository = AppDataSource.getRepository(Job);

    if (jobId) {
        job = await jobRepository.findOne({ where: { id: jobId } });
    } else if (candidateId) {
        // For status updates, we need to get the job through the candidate
        const candidateRepository = AppDataSource.getRepository("Candidate");
        const candidate = await candidateRepository.findOne({
            where: { id: candidateId },
            relations: ["job"]
        });
        if (candidate) {
            // @ts-ignore
            job = candidate.job;
        }
    }

    if (!job) {
        res.status(404).send("Job not found");
        return;
    }

    if (job.status === JobStatus.CLOSED) {
        res.status(400).send("Cannot modify closed job");
        return;
    }

    next();
};
