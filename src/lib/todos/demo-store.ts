import type { Attachment, CreateTodoInput, DailyBucket, Todo } from "@/apis/todos.types";

const initialTodos: Todo[] = [
  { id: "upin-1", title: "Sketch the UPin home screen", completed: false, position: 0, bucket: "today", scheduledFor: "2026-08-27", bucketId: "morning-2026-08-27", createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-2", title: "Pick up cat food", completed: false, position: 0, bucket: "today", scheduledFor: "2026-08-27", bucketId: "later-2026-08-27", createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-3", title: "Reply to Mara", completed: true, position: 1, bucket: "today", scheduledFor: "2026-08-27", bucketId: "morning-2026-08-27", createdAt: "2026-08-27T00:00:00.000Z" },
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
export function deleteDemoBucket(id: string) { const day = Object.values(bucketDays).find((buckets) => buckets.some((bucket) => bucket.id === id)); const index = day?.findIndex((bucket) => bucket.id === id) ?? -1; if (!day || index < 0) return null; const [bucket] = day.splice(index, 1); for (const todo of todos) if (todo.bucketId === id) todo.bucketId = null; return bucket; }
export function reorderDemoBuckets(bucketIds: string[], date?: string) { const buckets = demoDay(date); bucketIds.forEach((id, position) => { const bucket = buckets.find((candidate) => candidate.id === id); if (bucket) bucket.position = position; }); return listDemoBuckets(date); }

export function listDemoTodos(bucket: Todo["bucket"], date?: string) { return todos.filter((todo) => bucket === "inbox" ? !todo.scheduledFor : todo.scheduledFor === date); }

export function createDemoTodo(input: CreateTodoInput) {
  const todo: Todo = { id: crypto.randomUUID(), title: input.title.trim(), bucket: input.bucket, scheduledFor: input.scheduledFor ?? null, bucketId: input.bucketId, completed: false, position: todos.filter((item) => item.bucketId === input.bucketId && item.scheduledFor === input.scheduledFor).length, createdAt: new Date().toISOString() };
  todos.unshift(todo);
  return todo;
}

export function updateDemoTodo(id: string, input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "detailsMarkdown">>) {
  const todo = todos.find((candidate) => candidate.id === id);
  if (!todo) return null;
  Object.assign(todo, input);
  return todo;
}
export function deleteDemoTodo(id: string) { const index = todos.findIndex((candidate) => candidate.id === id); if (index < 0) return null; const [todo] = todos.splice(index, 1); const relatedAttachments = demoAttachments.filter((attachment) => attachment.todoId === id); for (const attachment of relatedAttachments) demoAttachments.splice(demoAttachments.indexOf(attachment), 1); return { todo, attachments: relatedAttachments }; }
export function getDemoCarryReview(day: string) { const previousDate = previousDay(day); return { reviewed: reviewedDays.has(day), previousDate, tasks: todos.filter((todo) => todo.scheduledFor === previousDate && !todo.completed) }; }
export function completeDemoCarryReview(day: string, todoIds: string[]) { for (const todo of todos) if (todoIds.includes(todo.id)) { todo.scheduledFor = day; todo.bucketId = null; } reviewedDays.add(day); return getDemoCarryReview(day); }
export function reorderDemoTodos(items: { id: string; bucketId: string | null; position: number }[]) { for (const item of items) { const todo = todos.find((candidate) => candidate.id === item.id); if (todo) Object.assign(todo, item); } return todos; }
const attachmentStore = globalThis as unknown as { upinAttachments?: (Attachment & { storageKey: string })[] };
const demoAttachments = attachmentStore.upinAttachments ?? []; attachmentStore.upinAttachments = demoAttachments;
function publicAttachment(item: Attachment & { storageKey: string }): Attachment { return { id: item.id, todoId: item.todoId, name: item.name, mimeType: item.mimeType, sizeBytes: item.sizeBytes, createdAt: item.createdAt }; }
export function listDemoAttachments(todoId: string) { return demoAttachments.filter((item) => item.todoId === todoId).map(publicAttachment); }
export function createDemoAttachment(todoId: string, value: { name: string; mimeType: string; sizeBytes: number; storageKey: string }) { const item = { id: crypto.randomUUID(), todoId, createdAt: new Date().toISOString(), ...value }; demoAttachments.push(item); return publicAttachment(item); }
export function getDemoAttachment(id: string) { return demoAttachments.find((item) => item.id === id) ?? null; }
export function deleteDemoAttachment(id: string) { const index = demoAttachments.findIndex((item) => item.id === id); return index < 0 ? null : demoAttachments.splice(index, 1)[0]; }
