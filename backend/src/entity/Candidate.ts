import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { Comment } from "./Comment";
import { Job } from "./Job";
import { User } from "./User";

export enum CandidateStatus {
  NEW = "new",
  SHORTLISTED = "shortlisted",
  INTERVIEW_SCHEDULED = "interview_scheduled",
  OFFER = "offer",
  HIRED = "hired",
  REJECTED = "rejected",
}

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  current_address: string;

  @Column({ type: "text", nullable: true })
  permanent_address: string;

  @Column()
  cv_file_path: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ nullable: true })
  cover_letter_path: string;

  @Column({ type: "json", nullable: true })
  education: any[];

  @Column({ type: "json", nullable: true })
  experience: any[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  desired_salary: number;

  @Column({ nullable: true })
  referred_by: string;

  @Column({ nullable: true })
  website: string;

  @Column({
    type: "varchar",
    default: "new",
  })
  status: string;

  @Column({ type: "timestamp", nullable: true })
  interview_date: Date;

  @Column({ nullable: true })
  interview_link: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Job, (job) => job.candidates)
  job: Job;

  @ManyToOne(() => User, { nullable: true })
  created_by: User;

  @OneToMany(() => Comment, (comment) => comment.candidate)
  comments: Comment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
