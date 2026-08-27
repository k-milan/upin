import type { CreateTodoInput, DailyBucket, Todo } from "@/apis/todos.types";

const initialTodos: Todo[] = [
  { id: "upin-1", title: "Sketch the UPin home screen", completed: false, bucket: "today", bucketId: "morning", checklist: [{ id: "upin-1-a", text: "Choose the first daily view", completed: true }], createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-2", title: "Pick up cat food", completed: false, bucket: "today", bucketId: "errands", checklist: [], createdAt: "2026-08-27T00:00:00.000Z" },
  { id: "upin-3", title: "Reply to Mara", completed: true, bucket: "today", bucketId: "morning", checklist: [], createdAt: "2026-08-27T00:00:00.000Z" },
];

const globalStore = globalThis as unknown as { upinTodos?: Todo[] };
const todos = globalStore.upinTodos ?? initialTodos;
globalStore.upinTodos = todos;

const bucketStore = globalThis as unknown as { upinBuckets?: DailyBucket[] };
const buckets = bucketStore.upinBuckets ?? [{ id: "morning", name: "Morning", position: 0 }, { id: "errands", name: "Errands", position: 1 }, { id: "later", name: "Later", position: 2 }];
bucketStore.upinBuckets = buckets;

export function listDemoBuckets() { return [...buckets].sort((a, b) => a.position - b.position); }
export function createDemoBucket(name: string) { const bucket = { id: crypto.randomUUID(), name: name.trim(), position: buckets.length }; buckets.push(bucket); return bucket; }
export function updateDemoBucket(id: string, name: string) { const bucket = buckets.find((candidate) => candidate.id === id); if (!bucket) return null; bucket.name = name.trim(); return bucket; }
export function reorderDemoBuckets(bucketIds: string[]) { bucketIds.forEach((id, position) => { const bucket = buckets.find((candidate) => candidate.id === id); if (bucket) bucket.position = position; }); return listDemoBuckets(); }

export function listDemoTodos(bucket: Todo["bucket"]) { return todos.filter((todo) => todo.bucket === bucket); }

export function createDemoTodo(input: CreateTodoInput) {
  const todo: Todo = { id: crypto.randomUUID(), title: input.title.trim(), bucket: input.bucket, bucketId: input.bucketId, completed: false, checklist: [], createdAt: new Date().toISOString() };
  todos.unshift(todo);
  return todo;
}

export function updateDemoTodo(id: string, input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "notes" | "detailsMarkdown" | "checklist">>) {
  const todo = todos.find((candidate) => candidate.id === id);
  if (!todo) return null;
  Object.assign(todo, input);
  return todo;
}
