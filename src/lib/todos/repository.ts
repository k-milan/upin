import { and, asc, eq, gt, gte, isNull, lt, lte, or } from "drizzle-orm";

import type {
  Attachment,
  CreateTodoInput,
  DailyBucket,
  Todo,
} from "@/apis/todos.types";
import { getDatabase } from "@/db";
import {
  attachments,
  bucketExclusions,
  dailyBuckets,
  todos,
} from "@/db/schema";

function dbOrThrow() {
  const db = getDatabase();
  if (!db) throw new Error("DATABASE_URL is not configured.");
  return db;
}
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    new Date(),
  );
}
function startOfManilaDay(day: string) {
  return new Date(`${day}T00:00:00+08:00`);
}
function mapTodo(todo: typeof todos.$inferSelect): Todo {
  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    position: todo.position,
    bucket: "today",
    scheduledFor:
      todo.scheduledFor && todo.scheduledFor > today()
        ? todo.scheduledFor
        : null,
    bucketId: todo.bucketId,
    detailsMarkdown: todo.detailsMarkdown,
    createdAt: todo.createdAt.toISOString(),
    completedAt: todo.completedAt?.toISOString() ?? null,
  };
}

export async function listPersistentTodos(
  bucket: Todo["bucket"],
  day = today(),
  archived = false,
) {
  const db = dbOrThrow();
  if (bucket === "inbox") {
    const dayStart = startOfManilaDay(day);
    const archiveFilter = archived
      ? and(
          eq(todos.completed, true),
          or(lt(todos.completedAt, dayStart), isNull(todos.completedAt)),
        )
      : or(eq(todos.completed, false), gte(todos.completedAt, dayStart));
    const rows = await db
      .select()
      .from(todos)
      .where(and(isNull(todos.scheduledFor), archiveFilter))
      .orderBy(asc(todos.completed), asc(todos.position));
    return rows.map(mapTodo);
  }
  const rows = await db
    .select()
    .from(todos)
    .where(
      day === today()
        ? and(
            or(isNull(todos.scheduledFor), lte(todos.scheduledFor, day)),
            or(
              eq(todos.completed, false),
              gte(todos.completedAt, startOfManilaDay(day)),
            ),
          )
        : eq(todos.scheduledFor, day),
    )
    .orderBy(asc(todos.completed), asc(todos.position));
  return rows.map(mapTodo);
}
export async function createPersistentTodo(input: CreateTodoInput) {
  const db = dbOrThrow();
  const scheduledFor =
    input.scheduledFor && input.scheduledFor > today()
      ? input.scheduledFor
      : null;
  if (input.bucketId) {
    const buckets = await listPersistentBuckets(scheduledFor ?? today());
    if (!buckets.some((bucket) => bucket.id === input.bucketId))
      throw new Error("That bucket does not belong to the selected day.");
  }
  const [todo] = await db
    .insert(todos)
    .values({
      title: input.title.trim(),
      scheduledFor,
      bucketId: input.bucketId ?? null,
    })
    .returning();
  return mapTodo(todo);
}
export async function schedulePersistentTodo(
  id: string,
  scheduledFor: string | null,
  bucketId: string | null = null,
) {
  const db = dbOrThrow();
  const futureDate =
    scheduledFor && scheduledFor > today() ? scheduledFor : null;
  if (bucketId) {
    const buckets = await listPersistentBuckets(futureDate ?? today());
    if (!buckets.some((bucket) => bucket.id === bucketId))
      throw new Error("That bucket does not belong to the selected day.");
  }
  const destination = futureDate
    ? await db
        .select({ id: todos.id })
        .from(todos)
        .where(
          and(
            eq(todos.scheduledFor, futureDate),
            bucketId ? eq(todos.bucketId, bucketId) : isNull(todos.bucketId),
          ),
        )
    : await db
        .select({ id: todos.id })
        .from(todos)
        .where(isNull(todos.scheduledFor));
  const [todo] = await db
    .update(todos)
    .set({
      scheduledFor: futureDate,
      bucketId,
      position: destination.filter((item) => item.id !== id).length,
    })
    .where(eq(todos.id, id))
    .returning();
  return todo ? mapTodo(todo) : null;
}
export async function carryForwardPersistentTodos(
  ids: string[],
  targetDate: string,
  bucketId: string | null = null,
) {
  const moved = [];
  for (const id of ids) {
    const [current] = await dbOrThrow()
      .select({ completed: todos.completed })
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);
    if (!current || current.completed) continue;
    const todo = await schedulePersistentTodo(id, targetDate, bucketId);
    if (todo) moved.push(todo);
  }
  return moved;
}
export async function updatePersistentTodo(
  id: string,
  input: Partial<
    Pick<
      Todo,
      "completed" | "title" | "bucket" | "bucketId" | "detailsMarkdown"
    >
  >,
) {
  const db = dbOrThrow();
  const [todo] = await db
    .update(todos)
    .set({
      title: input.title?.trim(),
      completed: input.completed,
      completedAt:
        input.completed === true
          ? new Date()
          : input.completed === false
            ? null
            : undefined,
      bucketId: input.bucketId,
      detailsMarkdown: input.detailsMarkdown,
      scheduledFor: input.bucket === "inbox" ? null : undefined,
    })
    .where(eq(todos.id, id))
    .returning();
  return todo ? mapTodo(todo) : null;
}
export async function deletePersistentTodo(id: string) {
  const db = dbOrThrow();
  return db.transaction(async (tx) => {
    const relatedAttachments = await tx
      .select()
      .from(attachments)
      .where(eq(attachments.todoId, id));
    const [todo] = await tx.delete(todos).where(eq(todos.id, id)).returning();
    return todo
      ? { todo: mapTodo(todo), attachments: relatedAttachments }
      : null;
  });
}
export async function listPersistentBuckets(
  day = today(),
): Promise<DailyBucket[]> {
  const db = dbOrThrow();
  const [rows, exclusions] = await Promise.all([
    db
      .select({
        id: dailyBuckets.id,
        name: dailyBuckets.name,
        position: dailyBuckets.position,
        persistent: dailyBuckets.persistent,
      })
      .from(dailyBuckets)
      .where(
        or(
          and(eq(dailyBuckets.persistent, false), eq(dailyBuckets.date, day)),
          and(
            eq(dailyBuckets.persistent, true),
            or(
              isNull(dailyBuckets.endsBefore),
              gt(dailyBuckets.endsBefore, day),
            ),
          ),
        ),
      )
      .orderBy(asc(dailyBuckets.position)),
    db
      .select({ bucketId: bucketExclusions.bucketId })
      .from(bucketExclusions)
      .where(eq(bucketExclusions.date, day)),
  ]);
  const excluded = new Set(exclusions.map((item) => item.bucketId));
  return rows.filter(
    (bucket) => !bucket.persistent || !excluded.has(bucket.id),
  );
}
export async function createPersistentBucket(
  name: string,
  day = today(),
  persistent = false,
): Promise<DailyBucket> {
  const db = dbOrThrow();
  const existing = await listPersistentBuckets(day);
  const [bucket] = await db
    .insert(dailyBuckets)
    .values({
      date: day,
      name: name.trim(),
      position: existing.length,
      persistent,
    })
    .returning({
      id: dailyBuckets.id,
      name: dailyBuckets.name,
      position: dailyBuckets.position,
      persistent: dailyBuckets.persistent,
    });
  return bucket;
}
export async function updatePersistentBucket(id: string, name: string) {
  const db = dbOrThrow();
  const [bucket] = await db
    .update(dailyBuckets)
    .set({ name: name.trim() })
    .where(eq(dailyBuckets.id, id))
    .returning({
      id: dailyBuckets.id,
      name: dailyBuckets.name,
      position: dailyBuckets.position,
      persistent: dailyBuckets.persistent,
    });
  return bucket ?? null;
}
export async function deletePersistentBucket(
  id: string,
  day: string,
  scope: "day" | "future" | "all",
) {
  const db = dbOrThrow();
  return db.transaction(async (tx) => {
    const [bucket] = await tx
      .select({
        id: dailyBuckets.id,
        name: dailyBuckets.name,
        position: dailyBuckets.position,
        persistent: dailyBuckets.persistent,
      })
      .from(dailyBuckets)
      .where(eq(dailyBuckets.id, id));
    if (!bucket) return null;
    if (bucket.persistent && scope === "day") {
      await tx
        .update(todos)
        .set({ bucketId: null })
        .where(and(eq(todos.bucketId, id), eq(todos.scheduledFor, day)));
      await tx
        .insert(bucketExclusions)
        .values({ bucketId: id, date: day })
        .onConflictDoNothing();
    } else if (bucket.persistent && scope === "future") {
      await tx
        .update(todos)
        .set({ bucketId: null })
        .where(and(eq(todos.bucketId, id), gte(todos.scheduledFor, day)));
      await tx
        .update(dailyBuckets)
        .set({ endsBefore: day })
        .where(eq(dailyBuckets.id, id));
    } else {
      await tx
        .update(todos)
        .set({ bucketId: null })
        .where(eq(todos.bucketId, id));
      await tx.delete(dailyBuckets).where(eq(dailyBuckets.id, id));
    }
    return { bucket, attachments: [] };
  });
}
export async function reorderPersistentBuckets(ids: string[], day = today()) {
  const db = dbOrThrow();
  await db.transaction(async (tx) =>
    Promise.all(
      ids.map((id, position) =>
        tx
          .update(dailyBuckets)
          .set({ position })
          .where(
            and(
              eq(dailyBuckets.id, id),
              or(eq(dailyBuckets.date, day), eq(dailyBuckets.persistent, true)),
            ),
          ),
      ),
    ),
  );
  return listPersistentBuckets(day);
}
export async function reorderPersistentTodos(
  items: { id: string; bucketId: string | null; position: number }[],
) {
  const db = dbOrThrow();
  await db.transaction(async (tx) =>
    Promise.all(
      items.map((item) =>
        tx
          .update(todos)
          .set({ bucketId: item.bucketId, position: item.position })
          .where(eq(todos.id, item.id)),
      ),
    ),
  );
}
function mapAttachment(value: typeof attachments.$inferSelect): Attachment {
  return {
    id: value.id,
    todoId: value.todoId,
    name: value.name,
    mimeType: value.mimeType,
    sizeBytes: value.sizeBytes,
    createdAt: value.createdAt.toISOString(),
  };
}
export async function listPersistentAttachments(todoId: string) {
  const db = dbOrThrow();
  return (
    await db
      .select()
      .from(attachments)
      .where(eq(attachments.todoId, todoId))
      .orderBy(asc(attachments.createdAt))
  ).map(mapAttachment);
}
export async function createPersistentAttachment(
  todoId: string,
  value: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  },
) {
  const db = dbOrThrow();
  const [attachment] = await db
    .insert(attachments)
    .values({ todoId, ...value })
    .returning();
  return mapAttachment(attachment);
}
export async function getPersistentAttachment(id: string) {
  const db = dbOrThrow();
  const [value] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  return value ?? null;
}
export async function deletePersistentAttachment(id: string) {
  const db = dbOrThrow();
  const [value] = await db
    .delete(attachments)
    .where(eq(attachments.id, id))
    .returning();
  return value ?? null;
}
