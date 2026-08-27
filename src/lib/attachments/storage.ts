import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "storage", "attachments");
function filePath(key: string) { return path.join(directory, path.basename(key)); }
export async function storeAttachment(bytes: Uint8Array) { await mkdir(directory, { recursive: true }); const key = crypto.randomUUID(); await writeFile(filePath(key), bytes); return key; }
export async function readAttachment(key: string) { return readFile(filePath(key)); }
export async function removeAttachment(key: string) { await unlink(filePath(key)).catch(() => undefined); }
