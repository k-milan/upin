import { createDemoAttachment, listDemoAttachments } from "@/lib/todos/demo-store";
import { createPersistentAttachment, listPersistentAttachments } from "@/lib/todos/repository";
import { storeAttachment } from "@/lib/attachments/storage";

const maximumSize = 10 * 1024 * 1024;

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Response.json(process.env.DATABASE_URL ? await listPersistentAttachments(id) : listDemoAttachments(id));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a file to attach." }, { status: 400 });
  if (file.size > maximumSize) return Response.json({ error: "Attachments must be 10 MB or smaller." }, { status: 413 });
  const storageKey = await storeAttachment(new Uint8Array(await file.arrayBuffer()));
  const value = { name: file.name.slice(0, 255), mimeType: file.type || "application/octet-stream", sizeBytes: file.size, storageKey };
  const attachment = process.env.DATABASE_URL ? await createPersistentAttachment(id, value) : createDemoAttachment(id, value);
  return Response.json(attachment, { status: 201 });
}
