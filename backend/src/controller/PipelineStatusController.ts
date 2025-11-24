import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PipelineStatus } from "../entity/PipelineStatus";

export class PipelineStatusController {
  private statusRepository = AppDataSource.getRepository(PipelineStatus);

  async getAll(req: Request, res: Response) {
    try {
      const statuses = await this.statusRepository.find({
        order: {
          order: "ASC",
        },
      });
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching pipeline statuses:", error);
      res.status(500).json({ message: "Error fetching pipeline statuses" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { value, label, order } = req.body;
      
      const existing = await this.statusRepository.findOne({ where: { value } });
      if (existing) {
        return res.status(400).json({ message: "Status with this value already exists" });
      }

      const status = this.statusRepository.create({
        value,
        label,
        order: order || 0,
      });

      await this.statusRepository.save(status);
      res.status(201).json(status);
    } catch (error) {
      console.error("Error creating pipeline status:", error);
      res.status(500).json({ message: "Error creating pipeline status" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { label, order } = req.body;

      if (!id) {
        return res.status(400).json({ message: "ID is required" });
      }

      const status = await this.statusRepository.findOne({ where: { id } });
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      if (label) status.label = label;
      if (order !== undefined) status.order = order;

      await this.statusRepository.save(status);
      res.json(status);
    } catch (error) {
      console.error("Error updating pipeline status:", error);
      res.status(500).json({ message: "Error updating pipeline status" });
    }
  }

  async updateOrder(req: Request, res: Response) {
    try {
      const { orders } = req.body; // Array of { id: string, order: number }
      
      if (!Array.isArray(orders)) {
        return res.status(400).json({ message: "Invalid input" });
      }

      await AppDataSource.transaction(async (transactionalEntityManager) => {
        for (const item of orders) {
          if (item.id) {
             await transactionalEntityManager.update(PipelineStatus, item.id, { order: item.order });
          }
        }
      });

      res.json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Error updating status order:", error);
      res.status(500).json({ message: "Error updating status order" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
         return res.status(400).json({ message: "ID is required" });
      }

      const status = await this.statusRepository.findOne({ where: { id } });
      
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      // Prevent deleting default statuses if needed, but for now allow all
      // Maybe check if any candidate is using this status?
      // For now, let's just delete.

      await this.statusRepository.remove(status);
      res.json({ message: "Status deleted successfully" });
    } catch (error) {
      console.error("Error deleting pipeline status:", error);
      res.status(500).json({ message: "Error deleting pipeline status" });
    }
  }
}
