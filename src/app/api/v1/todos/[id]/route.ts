import { z } from "zod";

import { updateDemoTodo } from "@/lib/todos/demo-store";

const updateTodoSchema = z.object({ title: z.string().trim().min(1).max(280).optional(), completed: z.boolean().optional(), bucket: z.enum(["today", "inbox"]).optional(), bucketId: z.string().min(1).nullable().optional(), notes: z.string().max(10_000).optional(), detailsMarkdown: z.string().max(20_000).optional(), checklist: z.array(z.object({ id: z.string(), text: z.string().min(1).max(280), completed: z.boolean() })).optional() });

export async function PATCH(request: Request, context: RouteContext<"/api/v1/todos/[id]">) {
  const parsed = updateTodoSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid task update." }, { status: 400 });
  const { id } = await context.params;
  const todo = updateDemoTodo(id, parsed.data);
  if (!todo) return Response.json({ error: "Task not found." }, { status: 404 });
  return Response.json(todo);
}
