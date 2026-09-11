import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBucket,
  deleteBucket,
  reorderBuckets,
  updateBucket,
} from "@/apis/buckets";
import type { DailyBucket, Todo } from "@/apis/todos.types";
import { currentDay, optimisticList } from "@/lib/react-query/optimistic";

export function useCreateBucket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createBucket,
    onMutate: async (input) => {
      const id = `pending:${crypto.randomUUID()}`;
      return {
        id,
        transaction: await optimisticList<DailyBucket>(
          client,
          "daily-buckets",
          (items, key) =>
            input.persistent || (key[1] ?? currentDay()) === input.date
              ? [
                  ...items,
                  {
                    id,
                    name: input.name.trim(),
                    persistent: input.persistent,
                    position: items.length,
                  },
                ]
              : items,
        ),
      };
    },
    onError: () =>
      toast.error("Your new bucket wasn’t saved. Please try adding it again."),
    onSettled: (bucket, error, input, context) =>
      context?.transaction.finish(
        !!error,
        bucket
          ? (items, key) =>
              input.persistent || (key[1] ?? currentDay()) === input.date
                ? [...items.filter((item) => item.id !== context.id), bucket]
                : items
          : undefined,
      ),
  });
}
export function useUpdateBucket() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "bucket-writes" },
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateBucket(id, name),
    onMutate: ({ id, name }) =>
      optimisticList<DailyBucket>(client, "daily-buckets", (items) =>
        items.map((item) =>
          item.id === id ? { ...item, name: name.trim() } : item,
        ),
      ),
    onError: () =>
      toast.error("The bucket’s new name wasn’t saved. Please try again."),
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
export function useDeleteBucket() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "bucket-writes" },
    mutationFn: deleteBucket,
    onMutate: async ({ id, date, scope }) => {
      const bucket = client
        .getQueriesData<DailyBucket[]>({ queryKey: ["daily-buckets"] })
        .flatMap(([, items]) => items ?? [])
        .find((item) => item.id === id);
      const affected = (day: string) =>
        !bucket?.persistent ||
        scope === "all" ||
        (scope === "day" ? day === date : day >= date);
      const buckets = await optimisticList<DailyBucket>(
        client,
        "daily-buckets",
        (items, key) =>
          affected((key[1] as string | undefined) ?? currentDay())
            ? items.filter((item) => item.id !== id)
            : items,
      );
      const todos = await optimisticList<Todo>(client, "todos", (items) =>
        items.map((todo) =>
          todo.bucketId === id &&
          (!bucket?.persistent ||
            scope === "all" ||
            (todo.scheduledFor && affected(todo.scheduledFor)))
            ? { ...todo, bucketId: null }
            : todo,
        ),
      );
      return { buckets, todos };
    },
    onError: () => toast.error("The bucket wasn’t removed. Please try again."),
    onSettled: async (_, error, __, context) => {
      await Promise.all([
        context?.buckets.finish(!!error),
        context?.todos.finish(!!error),
      ]);
    },
  });
}
export function useReorderBuckets() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "bucket-writes" },
    mutationFn: reorderBuckets,
    onMutate: ({ bucketIds }) =>
      optimisticList<DailyBucket>(client, "daily-buckets", (items) =>
        items
          .map((item) =>
            bucketIds.includes(item.id)
              ? { ...item, position: bucketIds.indexOf(item.id) }
              : item,
          )
          .sort((a, b) => a.position - b.position),
      ),
    onError: () =>
      toast.error("The new bucket order wasn’t saved. Please try again."),
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
