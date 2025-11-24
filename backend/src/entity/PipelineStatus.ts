import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PipelineStatus {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  value: string;

  @Column()
  label: string;

  @Column({ type: "int", default: 0 })
  order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
