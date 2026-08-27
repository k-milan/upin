import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTodos } from "@/apis/todos";
import type { Todo } from "@/apis/todos.types";

const TODOS_KEY = ["todos"] as const;
const todoListKey = (bucket: Todo["bucket"]) => [...TODOS_KEY, "list", bucket] as const;

export function todosQueryOptions(bucket: Todo["bucket"] = "today") {
  return queryOptions({ queryKey: todoListKey(bucket), queryFn: () => fetchTodos(bucket) });
}

export function useTodos(bucket: Todo["bucket"] = "today") {
  return useQuery(todosQueryOptions(bucket));
}
