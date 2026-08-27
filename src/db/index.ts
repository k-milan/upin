import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabase() {
  if (!process.env.DATABASE_URL) return null;
  database ??= drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
  return database;
}
