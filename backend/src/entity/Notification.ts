import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export enum NotificationType {
    JOB_ASSIGNED = "JOB_ASSIGNED",
    CANDIDATE_ADDED = "CANDIDATE_ADDED",
    STATUS_CHANGE = "STATUS_CHANGE"
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({
        type: "enum",
        enum: NotificationType,
    })
    type: NotificationType;

    @Column()
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    relatedEntityId: number; // Job ID or Candidate ID depending on type

    @CreateDateColumn()
    createdAt: Date;
}
