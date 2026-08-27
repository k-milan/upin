import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createTodo, updateTodo } from "@/apis/todos";
import type { CreateTodoInput, Todo } from "@/apis/todos.types";
import { todosQueryOptions } from "@/lib/react-query/todos/todos.query";

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: (_, input) => queryClient.invalidateQueries({ queryKey: todosQueryOptions(input.bucket).queryKey }),
    onError: () => toast.error("Couldn’t add that task. Please try again."),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Todo, "completed" | "title" | "bucket" | "bucketId" | "notes" | "detailsMarkdown" | "checklist">> }) => updateTodo(id, input),
    onSuccess: (todo) => queryClient.invalidateQueries({ queryKey: todosQueryOptions(todo.bucket).queryKey }),
    onError: () => toast.error("Couldn’t update that task. Please try again."),
  });
}
