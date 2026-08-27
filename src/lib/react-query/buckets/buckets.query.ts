import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchBuckets } from "@/apis/buckets";

const BUCKETS_KEY = ["daily-buckets"] as const;
export function bucketsQueryOptions() { return queryOptions({ queryKey: BUCKETS_KEY, queryFn: fetchBuckets }); }
export function useBuckets() { return useQuery(bucketsQueryOptions()); }
