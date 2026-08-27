import http from "@/apis/http";
import type { CarryReview } from "@/apis/todos.types";

export async function fetchCarryReview(date: string) { return (await http.get<CarryReview>(`/v1/reviews?date=${date}`)).data; }
export async function completeCarryReview(input: { date: string; todoIds: string[] }) { return (await http.post<CarryReview>("/v1/reviews", input)).data; }
