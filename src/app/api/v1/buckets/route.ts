import { z } from "zod";
import { createDemoBucket, listDemoBuckets } from "@/lib/todos/demo-store";
import {
  createPersistentBucket,
  listPersistentBuckets,
} from "@/lib/todos/repository";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  date: z.string().date(),
  persistent: z.boolean().default(false),
});
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? undefined;
  return Response.json(
    process.env.DATABASE_URL
      ? await listPersistentBuckets(date)
      : listDemoBuckets(date),
  );
}
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      { error: "A bucket needs a name and date." },
      { status: 400 },
    );
  return Response.json(
    process.env.DATABASE_URL
      ? await createPersistentBucket(
          parsed.data.name,
          parsed.data.date,
          parsed.data.persistent,
        )
      : createDemoBucket(
          parsed.data.name,
          parsed.data.date,
          parsed.data.persistent,
        ),
    { status: 201 },
  );
}
