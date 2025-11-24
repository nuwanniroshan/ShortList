import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Job } from "../entity/Job";
import { Candidate } from "../entity/Candidate";
import { Comment } from "../entity/Comment";
import * as fs from "fs";
import * as path from "path";

async function clearData() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized");

    // Get repositories
    const commentRepository = AppDataSource.getRepository(Comment);
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const jobRepository = AppDataSource.getRepository(Job);

    // Use raw SQL to truncate tables with CASCADE to handle foreign keys
    console.log("🗑️  Clearing all data from database...");
    
    await AppDataSource.query('TRUNCATE TABLE "comment" CASCADE');
    console.log("   ✅ Comments cleared");
    
    await AppDataSource.query('TRUNCATE TABLE "candidate" CASCADE');
    console.log("   ✅ Candidates cleared");
    
    await AppDataSource.query('TRUNCATE TABLE "job" CASCADE');
    console.log("   ✅ Jobs cleared");

    // Clear uploads directory
    const uploadsDir = path.join(__dirname, "../../uploads");
    console.log("🗑️  Clearing uploads directory...");
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let filesDeleted = 0;
      
      for (const file of files) {
        // Skip .gitkeep if it exists
        if (file === ".gitkeep") continue;
        
        const filePath = path.join(uploadsDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          filesDeleted++;
        } else if (stat.isDirectory()) {
          // Recursively delete directory
          fs.rmSync(filePath, { recursive: true, force: true });
          filesDeleted++;
        }
      }
      
      console.log(`   Deleted ${filesDeleted} files/folders from uploads`);
    } else {
      console.log("   Uploads directory does not exist");
    }

    console.log("\n✅ All data cleared successfully!");
    
    // Close database connection
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    process.exit(1);
  }
}

clearData();
