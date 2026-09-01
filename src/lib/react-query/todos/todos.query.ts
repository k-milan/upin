import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTodos } from "@/apis/todos";
import type { Todo } from "@/apis/todos.types";

const TODOS_KEY = ["todos"] as const;
const todoListKey = (bucket: Todo["bucket"], date?: string, archived = false) =>
  [
    ...TODOS_KEY,
    "list",
    bucket,
    date,
    archived ? "archived" : "current",
  ] as const;

export function todosQueryOptions(
  bucket: Todo["bucket"] = "today",
  date?: string,
  archived = false,
) {
  return queryOptions({
    queryKey: todoListKey(bucket, date, archived),
    queryFn: () => fetchTodos(bucket, date, archived),
  });
}

export function useTodos(
  bucket: Todo["bucket"] = "today",
  date?: string,
  options?: { archived?: boolean; enabled?: boolean },
) {
  return useQuery({
    ...todosQueryOptions(bucket, date, options?.archived),
    enabled: options?.enabled,
  });
}
