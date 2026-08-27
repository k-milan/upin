import { z } from "zod";
import { createDemoBucket, listDemoBuckets } from "@/lib/todos/demo-store";

const schema = z.object({ name: z.string().trim().min(1).max(80) });
export function GET() { return Response.json(listDemoBuckets()); }
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "A bucket needs a name." }, { status: 400 }); return Response.json(createDemoBucket(parsed.data.name), { status: 201 }); }
