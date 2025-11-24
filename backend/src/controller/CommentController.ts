import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { Candidate } from "../entity/Candidate";
import { User } from "../entity/User";

export class CommentController {
  static async create(req: Request, res: Response) {
    const { candidateId } = req.params;
    const { text } = req.body;
    // @ts-ignore
    const user = req.user;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const commentRepository = AppDataSource.getRepository(Comment);
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const candidate = await candidateRepository.findOne({ where: { id: candidateId as string } });
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const creator = await userRepository.findOne({ where: { id: user.userId } });
      if (!creator) {
          return res.status(404).json({ message: "User not found" });
      }

      const comment = new Comment();
      comment.text = text;
      comment.candidate = candidate;
      comment.created_by = creator;

      await commentRepository.save(comment);
      return res.status(201).json(comment);
    } catch (error) {
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
}
