import http from "@/apis/http";
import type { CreateTodoInput, Todo } from "@/apis/todos.types";

export async function fetchTodos(bucket: Todo["bucket"] = "today", date?: string) {
  const response = await http.get<Todo[]>(`/v1/todos?bucket=${bucket}${date ? `&date=${date}` : ""}`);
  return response.data;
}

export async function createTodo(input: CreateTodoInput) {
  const response = await http.post<Todo>("/v1/todos", input);
  return response.data;
}

export async function updateTodo(id: string, input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "notes" | "detailsMarkdown" | "checklist">>) {
  const response = await http.patch<Todo>(`/v1/todos/${id}`, input);
  return response.data;
}
export async function deleteTodo(id: string) { await http.delete(`/v1/todos/${id}`); }
export async function reorderTodos(input: { items: { id: string; bucketId: string | null; position: number }[] }) { await http.patch("/v1/todos/order", input); }
