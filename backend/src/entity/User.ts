import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Job } from "./Job";

export enum UserRole {
  ADMIN = "admin",
  HR = "hr",
  ENGINEERING_MANAGER = "engineering_manager",
  RECRUITER = "recruiter",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.ENGINEERING_MANAGER,
  })
  role: UserRole;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  office_location: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Job, (job) => job.created_by)
  jobs: Job[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
