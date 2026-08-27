import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTodos } from "@/apis/todos";
import type { Todo } from "@/apis/todos.types";

const TODOS_KEY = ["todos"] as const;
const todoListKey = (bucket: Todo["bucket"], date?: string) => [...TODOS_KEY, "list", bucket, date] as const;

export function todosQueryOptions(bucket: Todo["bucket"] = "today", date?: string) {
  return queryOptions({ queryKey: todoListKey(bucket, date), queryFn: () => fetchTodos(bucket, date) });
}

export function useTodos(bucket: Todo["bucket"] = "today", date?: string) {
  return useQuery(todosQueryOptions(bucket, date));
}
