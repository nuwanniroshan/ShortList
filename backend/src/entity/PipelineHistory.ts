import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Candidate } from "./Candidate";
import { User } from "./User";

@Entity()
export class PipelineHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Candidate, { onDelete: "CASCADE" })
  candidate: Candidate;

  @Column({ nullable: true })
  old_status: string;

  @Column()
  new_status: string;

  @ManyToOne(() => User, { nullable: true })
  changed_by: User;

  @CreateDateColumn()
  changed_at: Date;
}
