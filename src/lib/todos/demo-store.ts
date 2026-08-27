import type { CreateTodoInput, DailyBucket, Todo } from "@/apis/todos.types";

const initialTodos: Todo[] = [
  { id: "upin-1", title: "Sketch the UPin home screen", completed: false, position: 0, bucket: "today", scheduledFor: "2026-08-27", bucketId: "morning-2026-08-27", checklist: [{ id: "upin-1-a", text: "Choose the first daily view", completed: true }], createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-2", title: "Pick up cat food", completed: false, position: 0, bucket: "today", scheduledFor: "2026-08-27", bucketId: "later-2026-08-27", checklist: [], createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-3", title: "Reply to Mara", completed: true, position: 1, bucket: "today", scheduledFor: "2026-08-27", bucketId: "morning-2026-08-27", checklist: [], createdAt: "2026-08-27T00:00:00.000Z" },
];

const globalStore = globalThis as unknown as { upinTodos?: Todo[] };
const todos = globalStore.upinTodos ?? initialTodos;
globalStore.upinTodos = todos;
const reviewStore = globalThis as unknown as { upinReviewedDays?: Set<string> };
const reviewedDays = reviewStore.upinReviewedDays ?? new Set<string>(); reviewStore.upinReviewedDays = reviewedDays;
function previousDay(day: string) { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10); }

const bucketStore = globalThis as unknown as { upinBucketsByDate?: Record<string, DailyBucket[]> };
const bucketDays = bucketStore.upinBucketsByDate ?? {};
bucketStore.upinBucketsByDate = bucketDays;
function demoDay(date?: string) { const key = date ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()); bucketDays[key] ??= [{ id: `morning-${key}`, name: "Morning", position: 0 }, { id: `later-${key}`, name: "Later", position: 1 }]; return bucketDays[key]; }

export function listDemoBuckets(date?: string) { return [...demoDay(date)].sort((a, b) => a.position - b.position); }
export function createDemoBucket(name: string, date?: string) { const buckets = demoDay(date); const bucket = { id: crypto.randomUUID(), name: name.trim(), position: buckets.length }; buckets.push(bucket); return bucket; }
export function updateDemoBucket(id: string, name: string) { const bucket = Object.values(bucketDays).flat().find((candidate) => candidate.id === id); if (!bucket) return null; bucket.name = name.trim(); return bucket; }
export function reorderDemoBuckets(bucketIds: string[], date?: string) { const buckets = demoDay(date); bucketIds.forEach((id, position) => { const bucket = buckets.find((candidate) => candidate.id === id); if (bucket) bucket.position = position; }); return listDemoBuckets(date); }

export function listDemoTodos(bucket: Todo["bucket"], date?: string) { return todos.filter((todo) => bucket === "inbox" ? !todo.scheduledFor : todo.scheduledFor === date); }

export function createDemoTodo(input: CreateTodoInput) {
  const todo: Todo = { id: crypto.randomUUID(), title: input.title.trim(), bucket: input.bucket, scheduledFor: input.scheduledFor ?? null, bucketId: input.bucketId, completed: false, position: todos.filter((item) => item.bucketId === input.bucketId && item.scheduledFor === input.scheduledFor).length, checklist: [], createdAt: new Date().toISOString() };
  todos.unshift(todo);
  return todo;
}

export function updateDemoTodo(id: string, input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "notes" | "detailsMarkdown" | "checklist">>) {
  const todo = todos.find((candidate) => candidate.id === id);
  if (!todo) return null;
  Object.assign(todo, input);
  return todo;
}
export function getDemoCarryReview(day: string) { const previousDate = previousDay(day); return { reviewed: reviewedDays.has(day), previousDate, tasks: todos.filter((todo) => todo.scheduledFor === previousDate && !todo.completed) }; }
export function completeDemoCarryReview(day: string, todoIds: string[]) { for (const todo of todos) if (todoIds.includes(todo.id)) { todo.scheduledFor = day; todo.bucketId = null; } reviewedDays.add(day); return getDemoCarryReview(day); }
export function reorderDemoTodos(items: { id: string; bucketId: string | null; position: number }[]) { for (const item of items) { const todo = todos.find((candidate) => candidate.id === item.id); if (todo) Object.assign(todo, item); } return todos; }
