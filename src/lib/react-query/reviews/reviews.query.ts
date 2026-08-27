import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeCarryReview, fetchCarryReview } from "@/apis/reviews";

export function carryReviewOptions(date: string) { return queryOptions({ queryKey: ["carry-review", date] as const, queryFn: () => fetchCarryReview(date) }); }
export function useCarryReview(date: string) { return useQuery(carryReviewOptions(date)); }
export function useCompleteCarryReview() { const client = useQueryClient(); return useMutation({ mutationFn: completeCarryReview, onSuccess: (_, input) => { client.invalidateQueries({ queryKey: ["carry-review", input.date] }); client.invalidateQueries({ queryKey: ["todos", "list", "today", input.date] }); } }); }
