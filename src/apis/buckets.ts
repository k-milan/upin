import http from "@/apis/http";
import type { DailyBucket } from "@/apis/todos.types";

export async function fetchBuckets() { return (await http.get<DailyBucket[]>("/v1/buckets")).data; }
export async function createBucket(name: string) { return (await http.post<DailyBucket>("/v1/buckets", { name })).data; }
export async function updateBucket(id: string, name: string) { return (await http.patch<DailyBucket>(`/v1/buckets/${id}`, { name })).data; }
export async function reorderBuckets(bucketIds: string[]) { return (await http.patch<DailyBucket[]>("/v1/buckets/order", { bucketIds })).data; }
