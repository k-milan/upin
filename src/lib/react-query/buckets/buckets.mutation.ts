import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBucket, reorderBuckets, updateBucket } from "@/apis/buckets";
import { bucketsQueryOptions } from "@/lib/react-query/buckets/buckets.query";

export function useCreateBucket() { const client = useQueryClient(); return useMutation({ mutationFn: createBucket, onSuccess: () => client.invalidateQueries({ queryKey: bucketsQueryOptions().queryKey }), onError: () => toast.error("Couldn’t add that bucket.") }); }
export function useUpdateBucket() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => updateBucket(id, name), onSuccess: () => client.invalidateQueries({ queryKey: bucketsQueryOptions().queryKey }), onError: () => toast.error("Couldn’t rename that bucket.") }); }
export function useReorderBuckets() { const client = useQueryClient(); return useMutation({ mutationFn: reorderBuckets, onSuccess: () => client.invalidateQueries({ queryKey: bucketsQueryOptions().queryKey }), onError: () => toast.error("Couldn’t reorder those buckets.") }); }
