import { AppDataSource } from "./data-source";
import { User, UserRole } from "./entity/User";
import { Job } from "./entity/Job";
import { Candidate, CandidateStatus } from "./entity/Candidate";
import { Comment } from "./entity/Comment";

async function main() {
  await AppDataSource.initialize();
  console.log("Database connected");

  // Clear existing data to avoid unique constraint errors
  // await AppDataSource.getRepository(Comment).delete({});
  // await AppDataSource.getRepository(Candidate).delete({});
  // Need to handle ManyToMany deletion carefully or just cascade? 
  // For simplicity, let's just create new unique emails
  const timestamp = Date.now();

  // 1. Create Users
  const admin = new User();
  admin.email = `admin_${timestamp}@test.com`;
  admin.password_hash = "hash";
  admin.role = UserRole.ADMIN;
  await AppDataSource.manager.save(admin);

  const hr = new User();
  hr.email = `hr_${timestamp}@test.com`;
  hr.password_hash = "hash";
  hr.role = UserRole.HR;
  await AppDataSource.manager.save(hr);

  const manager = new User();
  manager.email = `manager_${timestamp}@test.com`;
  manager.password_hash = "hash";
  manager.role = UserRole.ENGINEERING_MANAGER;
  await AppDataSource.manager.save(manager);

  const recruiter = new User();
  recruiter.email = `recruiter_${timestamp}@test.com`;
  recruiter.password_hash = "hash";
  recruiter.role = UserRole.RECRUITER;
  await AppDataSource.manager.save(recruiter);

  console.log("Users created");

  // 2. Admin creates Job
  const job = new Job();
  job.title = "Senior Engineer";
  job.description = "Great job";
  job.created_by = admin;
  job.assignees = [admin, manager, recruiter]; // Assign manager and recruiter
  await AppDataSource.manager.save(job);
  console.log("Job created and assigned");

  // 3. Recruiter adds Candidate
  const candidate = new Candidate();
  candidate.name = "John Doe";
  candidate.email = "john@doe.com";
  candidate.cv_file_path = "uploads/test.pdf";
  candidate.job = job;
  candidate.status = CandidateStatus.NEW;
  await AppDataSource.manager.save(candidate);
  console.log("Candidate added by Recruiter (simulated)");

  // 4. Manager updates status and adds comment
  candidate.status = CandidateStatus.INTERVIEW_SCHEDULED;
  candidate.interview_date = new Date();
  candidate.interview_link = "http://meet.com";
  await AppDataSource.manager.save(candidate);
  console.log("Candidate status updated by Manager");

  const comment = new Comment();
  comment.text = "Looks good!";
  comment.candidate = candidate;
  comment.created_by = manager;
  await AppDataSource.manager.save(comment);
  console.log("Comment added by Manager");

  // 5. Verify data
  const savedJob = await AppDataSource.getRepository(Job).findOne({ 
      where: { id: job.id }, 
      relations: ["assignees", "candidates"] 
  });
  
  console.log("Job Assignees:", savedJob?.assignees.map(u => u.email));
  console.log("Candidate Status:", savedJob?.candidates?.[0]?.status);
  
  const savedComments = await AppDataSource.getRepository(Comment).find({ where: { candidate: { id: candidate.id } }, relations: ["created_by"] });
  console.log("Comments:", savedComments.map(c => `${c.created_by.email}: ${c.text}`));

  console.log("\nCheck the console output above for '--- EMAIL NOTIFICATION ---' blocks to verify email sending.");
  console.log("Done");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
