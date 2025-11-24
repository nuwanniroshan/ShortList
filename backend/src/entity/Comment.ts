import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Candidate } from "./Candidate";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  text: string;

  @ManyToOne(() => User)
  created_by: User;

  @ManyToOne(() => Candidate, (candidate) => candidate.comments)
  candidate: Candidate;

  @CreateDateColumn()
  created_at: Date;
}
