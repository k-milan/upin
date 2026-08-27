import { z } from "zod";
import { reorderDemoBuckets } from "@/lib/todos/demo-store";
import { reorderPersistentBuckets } from "@/lib/todos/repository";

const schema = z.object({ bucketIds: z.array(z.string()).min(1), date: z.string().date() });
export async function PATCH(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid bucket order." }, { status: 400 }); return Response.json(process.env.DATABASE_URL ? await reorderPersistentBuckets(parsed.data.bucketIds, parsed.data.date) : reorderDemoBuckets(parsed.data.bucketIds, parsed.data.date)); }
