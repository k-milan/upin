import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createTodo, deleteTodo, reorderTodos, updateTodo } from "@/apis/todos";
import type { Todo } from "@/apis/todos.types";
import { currentDay, optimisticList } from "@/lib/react-query/optimistic";

export function belongsToList(todo: Todo, key: QueryKey) {
  const day = (key[3] as string | undefined) ?? currentDay();
  const completedEarlier =
    todo.completed &&
    (!todo.completedAt ||
      new Date(todo.completedAt) < new Date(`${day}T00:00:00+08:00`));
  if (key[2] === "inbox")
    return (
      !todo.scheduledFor &&
      (key[4] === "archived" ? completedEarlier : !completedEarlier)
    );
  return day === currentDay()
    ? (!todo.scheduledFor || todo.scheduledFor <= day) && !completedEarlier
    : todo.scheduledFor === day;
}
function placeTodo(items: Todo[], key: QueryKey, todo: Todo, oldId = todo.id) {
  const next = items.filter((item) => item.id !== oldId && item.id !== todo.id);
  if (belongsToList(todo, key)) next.push(todo);
  return next.sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) || a.position - b.position,
  );
}

export function useCreateTodo() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onMutate: async (input) => {
      const todo: Todo = {
        ...input,
        id: `pending:${crypto.randomUUID()}`,
        title: input.title.trim(),
        completed: false,
        position: 0,
        createdAt: new Date().toISOString(),
        scheduledFor:
          input.scheduledFor && input.scheduledFor > currentDay()
            ? input.scheduledFor
            : null,
      };
      const transaction = await optimisticList<Todo>(
        client,
        "todos",
        (items, key) => placeTodo(items, key, todo),
      );
      return { transaction, id: todo.id };
    },
    onError: () =>
      toast.error("Your new task wasn’t saved. Please try adding it again."),
    onSettled: (todo, error, _, context) =>
      context?.transaction.finish(
        !!error,
        todo
          ? (items, key) => placeTodo(items, key, todo, context.id)
          : undefined,
      ),
  });
}

export function useUpdateTodo() {
  const client = useQueryClient();
  return useMutation({
    // Preserve the order of rapid edits to the same task on the server.
    scope: { id: "todo-writes" },
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateTodo>[1];
    }) => updateTodo(id, input),
    onMutate: async ({ id, input }) => {
      const original = client
        .getQueriesData<Todo[]>({ queryKey: ["todos"] })
        .flatMap(([, items]) => items ?? [])
        .find((todo) => todo.id === id);
      const completedAt =
        input.completed === undefined
          ? undefined
          : input.completed
            ? new Date().toISOString()
            : null;
      return optimisticList<Todo>(client, "todos", (items, key) => {
        const current = items.find((todo) => todo.id === id) ?? original;
        if (!current) return items;
        const updated =
          input.scheduledFor !== undefined
            ? {
                ...current,
                scheduledFor:
                  input.scheduledFor && input.scheduledFor > currentDay()
                    ? input.scheduledFor
                    : null,
                bucketId: input.bucketId ?? null,
              }
            : {
                ...current,
                ...input,
                ...(input.title !== undefined
                  ? { title: input.title.trim() }
                  : {}),
                ...(completedAt !== undefined ? { completedAt } : {}),
                ...(input.bucket === "inbox" ? { scheduledFor: null } : {}),
              };
        return placeTodo(items, key, updated);
      });
    },
    onError: (_, { input }) => {
      let message = "Your task changes weren’t saved. Please try again.";
      if (input.scheduledFor !== undefined) {
        message = "The task’s new schedule wasn’t saved. Please try again.";
      } else if (Object.keys(input).length === 1) {
        if (input.completed !== undefined)
          message = input.completed
            ? "The task couldn’t be marked complete. Please try again."
            : "The task couldn’t be marked incomplete. Please try again.";
        else if (input.title !== undefined)
          message = "The task’s new name wasn’t saved. Please try again.";
        else if (input.detailsMarkdown !== undefined)
          message = "Your task notes weren’t saved. Please try again.";
        else if (input.bucket !== undefined || input.bucketId !== undefined)
          message = "That task move wasn’t saved. Please try again.";
      }
      toast.error(message);
    },
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
export function useDeleteTodo() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "todo-writes" },
    mutationFn: deleteTodo,
    onMutate: (id) =>
      optimisticList<Todo>(client, "todos", (items) =>
        items.filter((todo) => todo.id !== id),
      ),
    onError: () => toast.error("The task wasn’t deleted. Please try again."),
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
export function useReorderTodos() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "todo-writes" },
    mutationFn: reorderTodos,
    onMutate: ({ items: changes }) =>
      optimisticList<Todo>(client, "todos", (items) =>
        items.map((todo) => ({
          ...todo,
          ...changes.find((item) => item.id === todo.id),
        })),
      ),
    onError: () =>
      toast.error("That task move wasn’t saved. Please try again."),
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
