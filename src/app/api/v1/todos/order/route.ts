import { z } from "zod";
import { reorderDemoTodos } from "@/lib/todos/demo-store";
import { reorderPersistentTodos } from "@/lib/todos/repository";

const schema = z.object({ items: z.array(z.object({ id: z.string(), bucketId: z.string().nullable(), position: z.number().int().nonnegative() })) });
export async function PATCH(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid task order." }, { status: 400 }); if (process.env.DATABASE_URL) await reorderPersistentTodos(parsed.data.items); else reorderDemoTodos(parsed.data.items); return new Response(null, { status: 204 }); }
