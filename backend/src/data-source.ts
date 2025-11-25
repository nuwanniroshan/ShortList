import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entity/User";
import { Job } from "./entity/Job";
import { Candidate } from "./entity/Candidate";
import { Comment } from "./entity/Comment";
import { Office } from "./entity/Office";
import { Department } from "./entity/Department";
import { PipelineStatus } from "./entity/PipelineStatus";
import { PipelineHistory } from "./entity/PipelineHistory";
import { Notification } from "./entity/Notification";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "shortlist",
  synchronize: true, // Set to false in production
  logging: false,
  entities: [User, Job, Candidate, Comment, Office, Department, PipelineStatus, PipelineHistory, Notification],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});
