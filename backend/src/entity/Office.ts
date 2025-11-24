import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum OfficeType {
  HEADQUARTERS = "headquarters",
  BRANCH = "branch",
}

@Entity()
export class Office {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: "enum",
    enum: OfficeType,
    default: OfficeType.BRANCH,
  })
  type: OfficeType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
