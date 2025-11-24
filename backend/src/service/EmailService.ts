import * as nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER || 'test',
        pass: process.env.SMTP_PASS || 'test'
    }
  });

  // For this MVP, we'll just log to console to avoid needing real SMTP creds
  // But we'll structure it so it's easy to swap in a real transporter
  static async sendEmail(to: string, subject: string, text: string) {
    console.log(`\n--- EMAIL NOTIFICATION ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log(`--------------------------\n`);
    
    if (process.env.SMTP_HOST) {
        try {
            await this.transporter.sendMail({ from: '"Shortlist" <noreply@shortlist.com>', to, subject, text });
            console.log("Email sent via SMTP");
        } catch (e) {
            console.error("Failed to send email via SMTP", e);
        }
    }
  }

  static async notifyJobAssignment(email: string, jobTitle: string, jobDescription: string, startDate: Date, expectedClosingDate: Date) {
      await this.sendEmail(
          email,
          `New Job Assignment: ${jobTitle}`,
          `You have been assigned to the job "${jobTitle}".\n\nDescription: ${jobDescription}\n\nStart Date: ${startDate.toLocaleDateString()}\nExpected Closing Date: ${expectedClosingDate.toLocaleDateString()}\n\nLog in to view details and start working on this job.`
      );
  }

  static async notifyCandidateUpload(email: string, candidateName: string, jobTitle: string) {
      await this.sendEmail(
          email,
          `New Candidate for ${jobTitle}`,
          `A new candidate, ${candidateName}, has been uploaded for the job "${jobTitle}".`
      );
  }

  static async notifyStatusChange(email: string, candidateName: string, newStatus: string, jobTitle: string) {
      await this.sendEmail(
          email,
          `Candidate Status Update: ${candidateName}`,
          `Candidate ${candidateName} for job "${jobTitle}" has been moved to ${newStatus}.`
      );
  }
}
