import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { Candidate } from "../entity/Candidate";
import { User } from "../entity/User";
import fs from "fs";
import path from "path";

export class CommentController {
  static async create(req: Request, res: Response) {
    const { candidateId } = req.params;
    const { text } = req.body;
    const file = req.file;
    // @ts-ignore
    const user = req.user;

    if (!text && !file) {
      return res.status(400).json({ message: "Text or attachment is required" });
    }

    if (file) {
        // Validate file size (6MB max)
        if (file.size > 6 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "File size must not exceed 6MB" });
        }

        // Validate file type
        const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/gif"];
        if (!validTypes.includes(file.mimetype)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Only PDF, DOC, DOCX, and Images are allowed" });
        }
    }

    const commentRepository = AppDataSource.getRepository(Comment);
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const candidate = await candidateRepository.findOne({ where: { id: candidateId as string } });
      if (!candidate) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({ message: "Candidate not found" });
      }

      const creator = await userRepository.findOne({ where: { id: user.userId } });
      if (!creator) {
          if (file) fs.unlinkSync(file.path);
          return res.status(404).json({ message: "User not found" });
      }

      const comment = new Comment();
      comment.text = text || "";
      comment.candidate = candidate;
      comment.created_by = creator;
      
      if (file) {
          comment.attachment_path = file.path;
          comment.attachment_original_name = file.originalname;
          comment.attachment_type = file.mimetype;
          comment.attachment_size = file.size;
      }

      await commentRepository.save(comment);
      return res.status(201).json(comment);
    } catch (error) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(500).json({ message: "Error creating comment", error });
    }
  }

  static async listByCandidate(req: Request, res: Response) {
    const { candidateId } = req.params;
    const commentRepository = AppDataSource.getRepository(Comment);

    try {
      const comments = await commentRepository.find({
        where: { candidate: { id: candidateId as string } },
        relations: ["created_by"],
        order: { created_at: "ASC" }
      });
      return res.json(comments);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching comments", error });
    }
  }

  static async getAttachment(req: Request, res: Response) {
      const { id } = req.params;
      const commentRepository = AppDataSource.getRepository(Comment);

      try {
          const comment = await commentRepository.findOne({ where: { id: id as string } });
          if (!comment || !comment.attachment_path) {
              return res.status(404).json({ message: "Attachment not found" });
          }

          const filePath = path.resolve(comment.attachment_path);
          res.download(filePath, comment.attachment_original_name, (err) => {
              if (err) {
                  console.error("Error sending file:", err);
                  if (!res.headersSent) {
                    res.status(500).json({ message: "Error sending file" });
                  }
              }
          });
      } catch (error) {
          return res.status(500).json({ message: "Error fetching attachment", error });
      }
  }

  static async deleteAttachment(req: Request, res: Response) {
      const { id } = req.params;
      const commentRepository = AppDataSource.getRepository(Comment);
      // @ts-ignore
      const user = req.user;

      try {
          const comment = await commentRepository.findOne({ where: { id: id as string }, relations: ["created_by"] });
          if (!comment) {
              return res.status(404).json({ message: "Comment not found" });
          }

          if (comment.created_by.id !== user.userId) {
              return res.status(403).json({ message: "Not authorized to delete this attachment" });
          }

          if (comment.attachment_path && fs.existsSync(comment.attachment_path)) {
              fs.unlinkSync(comment.attachment_path);
          }

          // @ts-ignore
          comment.attachment_path = null;
          // @ts-ignore
          comment.attachment_original_name = null;
          // @ts-ignore
          comment.attachment_type = null;
          // @ts-ignore
          comment.attachment_size = null;

          await commentRepository.save(comment);
          return res.json({ message: "Attachment deleted successfully", comment });
      } catch (error) {
          return res.status(500).json({ message: "Error deleting attachment", error });
      }
  }
}
