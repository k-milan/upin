import { z } from "zod";
import { updateDemoBucket } from "@/lib/todos/demo-store";
import { updatePersistentBucket } from "@/lib/todos/repository";

const schema = z.object({ name: z.string().trim().min(1).max(80) });
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "A bucket needs a name." }, { status: 400 }); const { id } = await context.params; const bucket = process.env.DATABASE_URL ? await updatePersistentBucket(id, parsed.data.name) : updateDemoBucket(id, parsed.data.name); return bucket ? Response.json(bucket) : Response.json({ error: "Bucket not found." }, { status: 404 }); }
