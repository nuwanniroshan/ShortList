import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Office } from "../entity/Office";

export class OfficeController {
  static async list(req: Request, res: Response) {
    const officeRepository = AppDataSource.getRepository(Office);
    const offices = await officeRepository.find();
    return res.json(offices);
  }

  static async create(req: Request, res: Response) {
    const { name, address, type } = req.body;
    const officeRepository = AppDataSource.getRepository(Office);
    const office = new Office();
    office.name = name;
    office.address = address;
    office.type = type;
    await officeRepository.save(office);
    return res.status(201).json(office);
  }

  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const officeRepository = AppDataSource.getRepository(Office);
    const office = await officeRepository.findOne({ where: { id: id as string } });
    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }
    await officeRepository.remove(office);
    return res.status(204).send();
  }
}
