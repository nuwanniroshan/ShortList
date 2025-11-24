import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PipelineHistory } from "../entity/PipelineHistory";

export class PipelineHistoryController {
  static async getHistoryByCandidate(req: Request, res: Response) {
    const { id } = req.params;
    const pipelineHistoryRepository = AppDataSource.getRepository(PipelineHistory);
    
    try {
      const history = await pipelineHistoryRepository.find({
        where: { candidate: { id: id as string } },
        relations: ["changed_by"],
        order: { changed_at: "DESC" }
      });

      // Format the response to match frontend expectations
      const formattedHistory = history.map(record => ({
        id: record.id,
        old_status: record.old_status,
        new_status: record.new_status,
        changed_at: record.changed_at,
        changed_by: {
          email: record.changed_by?.email || "System",
          name: record.changed_by?.name
        }
      }));

      return res.json(formattedHistory);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching pipeline history", error });
    }
  }
}
