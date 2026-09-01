import { z } from "zod";

import { createDemoTodo, listDemoTodos } from "@/lib/todos/demo-store";
import {
  createPersistentTodo,
  listPersistentTodos,
} from "@/lib/todos/repository";

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(280),
  bucket: z.enum(["today", "inbox"]),
  bucketId: z.string().min(1).optional(),
  scheduledFor: z.string().date().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bucket = url.searchParams.get("bucket") === "inbox" ? "inbox" : "today";
  const archived =
    bucket === "inbox" && url.searchParams.get("archived") === "true";
  return Response.json(
    process.env.DATABASE_URL
      ? await listPersistentTodos(
          bucket,
          url.searchParams.get("date") ?? undefined,
          archived,
        )
      : listDemoTodos(
          bucket,
          url.searchParams.get("date") ?? undefined,
          archived,
        ),
  );
}

export async function POST(request: Request) {
  const parsed = createTodoSchema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json({ error: "A task needs a title." }, { status: 400 });
  try {
    return Response.json(
      process.env.DATABASE_URL
        ? await createPersistentTodo(parsed.data)
        : createDemoTodo(parsed.data),
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid task schedule.",
      },
      { status: 400 },
    );
  }
}
