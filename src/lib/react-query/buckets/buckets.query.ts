import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchBuckets } from "@/apis/buckets";

const BUCKETS_KEY = ["daily-buckets"] as const;
export function bucketsQueryOptions(date?: string) { return queryOptions({ queryKey: [...BUCKETS_KEY, date] as const, queryFn: () => fetchBuckets(date) }); }
export function useBuckets(date?: string) { return useQuery(bucketsQueryOptions(date)); }
