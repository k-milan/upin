import { z } from "zod";

import { deleteDemoTodo, updateDemoTodo } from "@/lib/todos/demo-store";
import { deletePersistentTodo, updatePersistentTodo } from "@/lib/todos/repository";
import { removeAttachment } from "@/lib/attachments/storage";

const updateTodoSchema = z.object({ title: z.string().trim().min(1).max(280).optional(), completed: z.boolean().optional(), bucket: z.enum(["today", "inbox"]).optional(), bucketId: z.string().min(1).nullable().optional(), detailsMarkdown: z.string().max(20_000).optional() });

export async function PATCH(request: Request, context: RouteContext<"/api/v1/todos/[id]">) {
  const parsed = updateTodoSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid task update." }, { status: 400 });
  const { id } = await context.params;
  const todo = process.env.DATABASE_URL ? await updatePersistentTodo(id, parsed.data) : updateDemoTodo(id, parsed.data);
  if (!todo) return Response.json({ error: "Task not found." }, { status: 404 });
  return Response.json(todo);
}

export async function DELETE(_: Request, context: RouteContext<"/api/v1/todos/[id]">) {
  const { id } = await context.params;
  const deleted = process.env.DATABASE_URL ? await deletePersistentTodo(id) : deleteDemoTodo(id);
  if (!deleted) return Response.json({ error: "Task not found." }, { status: 404 });
  await Promise.all(deleted.attachments.map((attachment) => removeAttachment(attachment.storageKey)));
  return new Response(null, { status: 204 });
}
