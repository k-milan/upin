import { z } from "zod";

import { createDemoTodo, listDemoTodos } from "@/lib/todos/demo-store";

const createTodoSchema = z.object({ title: z.string().trim().min(1).max(280), bucket: z.enum(["today", "inbox"]), bucketId: z.string().min(1).optional() });

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const bucket = new URL(request.url).searchParams.get("bucket") === "inbox" ? "inbox" : "today";
  return Response.json(listDemoTodos(bucket));
}

export async function POST(request: Request) {
  const parsed = createTodoSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "A task needs a title." }, { status: 400 });
  return Response.json(createDemoTodo(parsed.data), { status: 201 });
}
