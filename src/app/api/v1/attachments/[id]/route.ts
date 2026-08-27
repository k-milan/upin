import { getDemoAttachment, deleteDemoAttachment } from "@/lib/todos/demo-store";
import { deletePersistentAttachment, getPersistentAttachment } from "@/lib/todos/repository";
import { readAttachment, removeAttachment } from "@/lib/attachments/storage";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const attachment = process.env.DATABASE_URL ? await getPersistentAttachment(id) : getDemoAttachment(id);
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  try {
    const bytes = await readAttachment(attachment.storageKey);
    return new Response(bytes, { headers: { "Content-Type": attachment.mimeType, "Content-Length": String(attachment.sizeBytes), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}` } });
  } catch { return Response.json({ error: "Attachment file is missing." }, { status: 404 }); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const attachment = process.env.DATABASE_URL ? await deletePersistentAttachment(id) : deleteDemoAttachment(id);
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  await removeAttachment(attachment.storageKey);
  return new Response(null, { status: 204 });
}
