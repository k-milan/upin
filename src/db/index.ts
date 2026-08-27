import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

export function getDatabase() {
  if (!process.env.DATABASE_URL) return null;
  return drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
}
