import { z } from "zod";
import { completeDemoCarryReview, getDemoCarryReview } from "@/lib/todos/demo-store";
import { completePersistentCarryReview, getPersistentCarryReview } from "@/lib/todos/repository";

const schema = z.object({ date: z.string().date(), todoIds: z.array(z.string()) });
export async function GET(request: Request) { const date = new URL(request.url).searchParams.get("date"); if (!date) return Response.json({ error: "Date required." }, { status: 400 }); return Response.json(process.env.DATABASE_URL ? await getPersistentCarryReview(date) : getDemoCarryReview(date)); }
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Invalid carry-over review." }, { status: 400 }); return Response.json(process.env.DATABASE_URL ? await completePersistentCarryReview(parsed.data.date, parsed.data.todoIds) : completeDemoCarryReview(parsed.data.date, parsed.data.todoIds)); }
