import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchAttachments } from "@/apis/attachments";
export const attachmentsQueryOptions = (todoId: string) => queryOptions({ queryKey: ["attachments", todoId], queryFn: () => fetchAttachments(todoId) });
export function useAttachments(todoId: string) { return useQuery(attachmentsQueryOptions(todoId)); }
