import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBucket, deleteBucket, reorderBuckets, updateBucket } from "@/apis/buckets";
import { bucketsQueryOptions } from "@/lib/react-query/buckets/buckets.query";

export function useCreateBucket() { const client = useQueryClient(); return useMutation({ mutationFn: createBucket, onSuccess: (_, input) => client.invalidateQueries({ queryKey: bucketsQueryOptions(input.date).queryKey }), onError: () => toast.error("Couldn’t add that bucket.") }); }
export function useUpdateBucket() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => updateBucket(id, name), onSuccess: () => client.invalidateQueries({ queryKey: ["daily-buckets"] }), onError: () => toast.error("Couldn’t rename that bucket.") }); }
export function useDeleteBucket() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, deleteTasks }: { id: string; deleteTasks?: boolean }) => deleteBucket(id, deleteTasks), onSuccess: () => { client.invalidateQueries({ queryKey: ["daily-buckets"] }); client.invalidateQueries({ queryKey: ["todos"] }); }, onError: () => toast.error("Couldn’t delete that bucket.") }); }
export function useReorderBuckets() { const client = useQueryClient(); return useMutation({ mutationFn: reorderBuckets, onSuccess: (_, input) => client.invalidateQueries({ queryKey: bucketsQueryOptions(input.date).queryKey }), onError: () => toast.error("Couldn’t reorder those buckets.") }); }
