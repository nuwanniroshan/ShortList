import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../src/entity/User";
import { Job } from "../src/entity/Job";
import { Candidate } from "../src/entity/Candidate";
import { Comment } from "../src/entity/Comment";
import { Office } from "../src/entity/Office";
import { Department } from "../src/entity/Department";
import { PipelineStatus } from "../src/entity/PipelineStatus";
import { PipelineHistory } from "../src/entity/PipelineHistory";

dotenv.config();

async function migrate() {
  console.log("🚀 Starting data migration...");

  // Local Data Source
  const localDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "shortlist",
    entities: [User, Job, Candidate, Comment, Office, Department, PipelineStatus, PipelineHistory],
    synchronize: false,
    logging: false,
  });

  // Remote Data Source
  const remoteDataSource = new DataSource({
    type: "postgres",
    host: process.env.REMOTE_DB_HOST || "localhost",
    port: parseInt(process.env.REMOTE_DB_PORT || "5432"),
    username: process.env.REMOTE_DB_USERNAME || "postgres",
    password: process.env.REMOTE_DB_PASSWORD || "password",
    database: process.env.REMOTE_DB_NAME || "shortlist",
    entities: [User, Job, Candidate, Comment, Office, Department, PipelineStatus, PipelineHistory],
    synchronize: false, // Assume schema is already synced via CDK/TypeORM
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("🔌 Connecting to databases...");
    await localDataSource.initialize();
    console.log("✅ Connected to Local DB");
    await remoteDataSource.initialize();
    console.log("✅ Connected to Remote DB");

    // Helper to migrate entity
    const migrateEntity = async (entity: any, name: string) => {
      console.log(`\n📦 Migrating ${name}...`);
      const localRepo = localDataSource.getRepository(entity);
      const remoteRepo = remoteDataSource.getRepository(entity);

      const data = await localRepo.find();
      console.log(`   Found ${data.length} records in local DB`);

      let migrated = 0;
      let skipped = 0;

      for (const item of data) {
        // Check if exists
        const exists = await remoteRepo.findOne({ where: { id: item.id } });
        if (exists) {
          skipped++;
          continue;
        }

        try {
          await remoteRepo.save(item);
          migrated++;
        } catch (e: any) {
          console.error(`   ❌ Failed to migrate ${name} ${item.id}: ${e.message}`);
        }
      }

      console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
    };

    // Migrate in order of dependencies
    await migrateEntity(Office, "Offices");
    await migrateEntity(Department, "Departments");
    await migrateEntity(User, "Users");
    await migrateEntity(PipelineStatus, "PipelineStatuses");
    await migrateEntity(Job, "Jobs");
    await migrateEntity(Candidate, "Candidates");
    await migrateEntity(Comment, "Comments");
    await migrateEntity(PipelineHistory, "PipelineHistory");

    console.log("\n🎉 Migration complete!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    if (localDataSource.isInitialized) await localDataSource.destroy();
    if (remoteDataSource.isInitialized) await remoteDataSource.destroy();
  }
}

migrate();
