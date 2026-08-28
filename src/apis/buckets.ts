import http from "@/apis/http";
import type { DailyBucket } from "@/apis/todos.types";

export async function fetchBuckets(date?: string) { return (await http.get<DailyBucket[]>(`/v1/buckets${date ? `?date=${date}` : ""}`)).data; }
export async function createBucket(input: { name: string; date: string }) { return (await http.post<DailyBucket>("/v1/buckets", input)).data; }
export async function updateBucket(id: string, name: string) { return (await http.patch<DailyBucket>(`/v1/buckets/${id}`, { name })).data; }
export async function deleteBucket(id: string) { await http.delete(`/v1/buckets/${id}`); }
export async function reorderBuckets(input: { bucketIds: string[]; date: string }) { return (await http.patch<DailyBucket[]>("/v1/buckets/order", input)).data; }
