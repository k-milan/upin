import http from "@/apis/http";
import type { CreateTodoInput, Todo } from "@/apis/todos.types";

export async function fetchTodos(bucket: Todo["bucket"] = "today") {
  const response = await http.get<Todo[]>(`/v1/todos?bucket=${bucket}`);
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
