import { z } from "zod";
import { createDemoBucket, listDemoBuckets } from "@/lib/todos/demo-store";
import { createPersistentBucket, listPersistentBuckets } from "@/lib/todos/repository";

const schema = z.object({ name: z.string().trim().min(1).max(80) });
export async function GET() { return Response.json(process.env.DATABASE_URL ? await listPersistentBuckets() : listDemoBuckets()); }
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "A bucket needs a name." }, { status: 400 }); return Response.json(process.env.DATABASE_URL ? await createPersistentBucket(parsed.data.name) : createDemoBucket(parsed.data.name), { status: 201 }); }
