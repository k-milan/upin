import { z } from "zod";
import { deleteDemoBucket, updateDemoBucket } from "@/lib/todos/demo-store";
import {
  deletePersistentBucket,
  updatePersistentBucket,
} from "@/lib/todos/repository";

const schema = z.object({ name: z.string().trim().min(1).max(80) });
const deleteSchema = z.object({
  date: z.string().date(),
  scope: z.enum(["day", "future", "all"]),
});
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json({ error: "A bucket needs a name." }, { status: 400 });
  const { id } = await context.params;
  const bucket = process.env.DATABASE_URL
    ? await updatePersistentBucket(id, parsed.data.name)
    : updateDemoBucket(id, parsed.data.name);
  return bucket
    ? Response.json(bucket)
    : Response.json({ error: "Bucket not found." }, { status: 404 });
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = deleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid bucket deletion." },
      { status: 400 },
    );
  const { id } = await context.params;
  const deleted = process.env.DATABASE_URL
    ? await deletePersistentBucket(id, parsed.data.date, parsed.data.scope)
    : deleteDemoBucket(id, parsed.data.date, parsed.data.scope);
  if (!deleted)
    return Response.json({ error: "Bucket not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
