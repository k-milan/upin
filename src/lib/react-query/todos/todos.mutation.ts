import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createTodo, deleteTodo, reorderTodos, updateTodo } from "@/apis/todos";
import type {
  CreateTodoInput,
  TaskScheduleInput,
  Todo,
} from "@/apis/todos.types";
import { todosQueryOptions } from "@/lib/react-query/todos/todos.query";

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: (_, input) =>
      queryClient.invalidateQueries({
        queryKey: todosQueryOptions(input.bucket).queryKey,
      }),
    onError: () => toast.error("Couldn’t add that task. Please try again."),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<
        Pick<
          Todo,
          "completed" | "title" | "bucket" | "bucketId" | "detailsMarkdown"
        >
      > &
        Partial<TaskScheduleInput>;
    }) => updateTodo(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    onError: () => toast.error("Couldn’t update that task. Please try again."),
  });
}
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
    onError: () => toast.error("Couldn’t delete that task. Please try again."),
  });
}
export function useReorderTodos() {
  return useMutation({
    mutationFn: reorderTodos,
    onError: () => toast.error("Couldn’t save that task order."),
  });
}
