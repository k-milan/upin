import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAttachment, uploadAttachment } from "@/apis/attachments";
import type { Attachment } from "@/apis/todos.types";
import { optimisticList } from "@/lib/react-query/optimistic";
import { attachmentsQueryOptions } from "./attachments.query";

export function useUploadAttachment(todoId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(todoId, file),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: attachmentsQueryOptions(todoId).queryKey,
      }),
    onError: () =>
      toast.error("Your file wasn’t attached. Please try uploading it again."),
  });
}
export function useDeleteAttachment(todoId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteAttachment,
    onMutate: (id) =>
      optimisticList<Attachment>(client, "attachments", (items, key) =>
        key[1] === todoId ? items.filter((item) => item.id !== id) : items,
      ),
    onError: () =>
      toast.error("The attachment wasn’t removed. Please try again."),
    onSettled: (_, error, __, context) => context?.finish(!!error),
  });
}
