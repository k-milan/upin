import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before applying migrations.");
}

const pool = new Pool({ connectionString });

try {
  console.log("Applying database migrations…");
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("Database migrations are up to date.");
} finally {
  await pool.end();
}
