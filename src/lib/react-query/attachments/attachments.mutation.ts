import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAttachment, uploadAttachment } from "@/apis/attachments";
import { attachmentsQueryOptions } from "./attachments.query";
export function useUploadAttachment(todoId: string) { const client = useQueryClient(); return useMutation({ mutationFn: (file: File) => uploadAttachment(todoId, file), onSuccess: () => client.invalidateQueries({ queryKey: attachmentsQueryOptions(todoId).queryKey }), onError: () => toast.error("Couldn’t attach that file.") }); }
export function useDeleteAttachment(todoId: string) { const client = useQueryClient(); return useMutation({ mutationFn: deleteAttachment, onSuccess: () => client.invalidateQueries({ queryKey: attachmentsQueryOptions(todoId).queryKey }), onError: () => toast.error("Couldn’t remove that attachment.") }); }
