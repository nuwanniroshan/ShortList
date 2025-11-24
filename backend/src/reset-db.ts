import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "shortlist",
  synchronize: false,
  logging: false,
});

async function main() {
  await AppDataSource.initialize();
  console.log("Connected to DB");
  
  await AppDataSource.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  console.log("Schema dropped and recreated");
  
  process.exit(0);
}

main().catch(console.error);
