import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export class UserController {
  static async list(req: Request, res: Response) {
    const userRepository = AppDataSource.getRepository(User);
    try {
      const users = await userRepository.find({
        select: ["id", "email", "role", "name", "profile_picture", "department", "office_location", "is_active"] // Don't return passwords
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching users", error });
    }
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    try {
      const result = await userRepository.delete(id as string);
      if (result.affected === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Error deleting user", error });
    }
  }

  static async updateRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    try {
      const user = await userRepository.findOne({ where: { id: id as string } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.role = role;
      await userRepository.save(user);
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Error updating user role", error });
    }
  }
  static async updateProfile(req: Request, res: Response) {
    const { id } = req.params;
    const { name, department, office_location, profile_picture } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    try {
      const user = await userRepository.findOne({ where: { id: id as string } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (name) user.name = name;
      if (department) user.department = department;
      if (office_location) user.office_location = office_location;
      if (profile_picture) user.profile_picture = profile_picture;
      await userRepository.save(user);
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Error updating profile", error });
    }
  }

  static async toggleActive(req: Request, res: Response) {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    try {
      const user = await userRepository.findOne({ where: { id: id as string } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.is_active = !user.is_active;
      await userRepository.save(user);
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Error toggling active status", error });
    }
  }
}
