import { z } from "zod";
import { reorderDemoBuckets } from "@/lib/todos/demo-store";

const schema = z.object({ bucketIds: z.array(z.string()).min(1) });
export async function PATCH(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid bucket order." }, { status: 400 }); return Response.json(reorderDemoBuckets(parsed.data.bucketIds)); }
