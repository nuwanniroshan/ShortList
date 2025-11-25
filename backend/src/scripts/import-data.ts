import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { User } from "../entity/User";
import { Job } from "../entity/Job";
import { Candidate } from "../entity/Candidate";
import { Comment } from "../entity/Comment";
import { Office } from "../entity/Office";
import { Department } from "../entity/Department";
import { PipelineStatus } from "../entity/PipelineStatus";
import { PipelineHistory } from "../entity/PipelineHistory";
// @ts-ignore
import data from "./data-export.json";

dotenv.config();

async function importData() {
  console.log("🚀 Starting data import...");

  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "shortlist",
    entities: [User, Job, Candidate, Comment, Office, Department, PipelineStatus, PipelineHistory],
    synchronize: false,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log("✅ Connected to DB");

    // Helper to import entity
    const importEntity = async (entity: any, name: string) => {
      console.log(`📦 Importing ${name}...`);
      const repo = dataSource.getRepository(entity);
      const records = (data as any)[name];
      
      if (!records || records.length === 0) {
        console.log(`   No records found for ${name}`);
        return;
      }

      let imported = 0;
      let skipped = 0;

      for (const item of records) {
        const exists = await repo.findOne({ where: { id: item.id } });
        if (exists) {
          skipped++;
          continue;
        }

        try {
          // Handle dates properly if needed, TypeORM usually handles strings -> Date
          await repo.save(item);
          imported++;
        } catch (e: any) {
          console.error(`   ❌ Failed to import ${name} ${item.id}: ${e.message}`);
        }
      }

      console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}`);
    };

    // Import in order
    await importEntity(Office, "Office");
    await importEntity(Department, "Department");
    await importEntity(User, "User");
    await importEntity(PipelineStatus, "PipelineStatus");
    await importEntity(Job, "Job");
    await importEntity(Candidate, "Candidate");
    await importEntity(Comment, "Comment");
    await importEntity(PipelineHistory, "PipelineHistory");

    console.log("\n🎉 Import complete!");

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

importData();
