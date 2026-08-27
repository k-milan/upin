import http from "@/apis/http";
import type { Attachment } from "@/apis/todos.types";

export async function fetchAttachments(todoId: string) { return (await http.get<Attachment[]>(`/v1/todos/${todoId}/attachments`)).data; }
export async function uploadAttachment(todoId: string, file: File) { const body = new FormData(); body.append("file", file); return (await http.post<Attachment>(`/v1/todos/${todoId}/attachments`, body)).data; }
export async function deleteAttachment(id: string) { await http.delete(`/v1/attachments/${id}`); }
