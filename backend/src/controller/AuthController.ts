import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User();
    user.email = email;
    user.password_hash = hashedPassword;
    user.role = role === "recruiter" ? UserRole.RECRUITER : UserRole.ENGINEERING_MANAGER;

    try {
      await userRepository.save(user);
      return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error creating user", error });
    }
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  }
}
