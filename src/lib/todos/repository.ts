import { and, asc, eq, isNull } from "drizzle-orm";

import type { CreateTodoInput, DailyBucket, Todo } from "@/apis/todos.types";
import { getDatabase } from "@/db";
import { dailyBuckets, todos } from "@/db/schema";

function dbOrThrow() { const db = getDatabase(); if (!db) throw new Error("DATABASE_URL is not configured."); return db; }
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()); }
function mapTodo(todo: typeof todos.$inferSelect): Todo { return { id: todo.id, title: todo.title, completed: todo.completed, bucket: todo.scheduledFor ? "today" : "inbox", bucketId: todo.bucketId, detailsMarkdown: todo.detailsMarkdown, checklist: [], createdAt: todo.createdAt.toISOString() }; }

export async function listPersistentTodos(bucket: Todo["bucket"]) { const db = dbOrThrow(); const rows = bucket === "inbox" ? await db.select().from(todos).where(isNull(todos.scheduledFor)).orderBy(asc(todos.position)) : await db.select().from(todos).where(eq(todos.scheduledFor, today())).orderBy(asc(todos.position)); return rows.map(mapTodo); }
export async function createPersistentTodo(input: CreateTodoInput) { const db = dbOrThrow(); const [todo] = await db.insert(todos).values({ title: input.title.trim(), scheduledFor: input.bucket === "today" ? today() : null, bucketId: input.bucketId ?? null }).returning(); return mapTodo(todo); }
export async function updatePersistentTodo(id: string, input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "detailsMarkdown">>) { const db = dbOrThrow(); const [todo] = await db.update(todos).set({ title: input.title?.trim(), completed: input.completed, completedAt: input.completed === true ? new Date() : input.completed === false ? null : undefined, bucketId: input.bucketId, detailsMarkdown: input.detailsMarkdown, scheduledFor: input.bucket === "inbox" ? null : undefined }).where(eq(todos.id, id)).returning(); return todo ? mapTodo(todo) : null; }
export async function listPersistentBuckets(): Promise<DailyBucket[]> { const db = dbOrThrow(); return db.select({ id: dailyBuckets.id, name: dailyBuckets.name, position: dailyBuckets.position }).from(dailyBuckets).where(eq(dailyBuckets.date, today())).orderBy(asc(dailyBuckets.position)); }
export async function createPersistentBucket(name: string): Promise<DailyBucket> { const db = dbOrThrow(); const existing = await listPersistentBuckets(); const [bucket] = await db.insert(dailyBuckets).values({ date: today(), name: name.trim(), position: existing.length }).returning({ id: dailyBuckets.id, name: dailyBuckets.name, position: dailyBuckets.position }); return bucket; }
export async function updatePersistentBucket(id: string, name: string) { const db = dbOrThrow(); const [bucket] = await db.update(dailyBuckets).set({ name: name.trim() }).where(eq(dailyBuckets.id, id)).returning({ id: dailyBuckets.id, name: dailyBuckets.name, position: dailyBuckets.position }); return bucket ?? null; }
export async function reorderPersistentBuckets(ids: string[]) { const db = dbOrThrow(); await db.transaction(async (tx) => Promise.all(ids.map((id, position) => tx.update(dailyBuckets).set({ position }).where(and(eq(dailyBuckets.id, id), eq(dailyBuckets.date, today())))))); return listPersistentBuckets(); }
