"use client";

import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Download, GripVertical, Inbox, Moon, Paperclip, Plus, Sun, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTodo, useDeleteTodo, useReorderTodos, useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";
import { todosQueryOptions, useTodos } from "@/lib/react-query/todos/todos.query";
import { useCreateBucket, useDeleteBucket, useReorderBuckets, useUpdateBucket } from "@/lib/react-query/buckets/buckets.mutation";
import { bucketsQueryOptions, useBuckets } from "@/lib/react-query/buckets/buckets.query";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CarryReviewDialog } from "@/components/upin/carry-review-dialog";
import { useAttachments } from "@/lib/react-query/attachments/attachments.query";
import { useDeleteAttachment, useUploadAttachment } from "@/lib/react-query/attachments/attachments.mutation";

function TaskRow({ todo, onOpen, onDeleted }: { todo: Todo; onOpen: () => void; onDeleted: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: todo.id });
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const checklist = todo.checklist ?? [];
  return <div ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} className={cn("flex items-center gap-2 border-b border-border py-3.5 last:border-b-0", isDragging && "opacity-40")}>
    <button type="button" {...listeners} {...attributes} aria-label={`Move ${todo.title}`} className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground"><GripVertical className="size-4" /></button>
    <Checkbox checked={todo.completed} onCheckedChange={(checked) => updateTodo.mutate({ id: todo.id, input: { completed: checked === true } })} className="size-5 rounded-[7px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
    <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left"><span className={cn("block text-[15px] leading-6", todo.completed && "text-muted-foreground line-through decoration-muted-foreground/50")}>{todo.title}</span>{(todo.detailsMarkdown || todo.notes || checklist.length > 0) && <span className="text-xs text-muted-foreground">Details</span>}</button>
    {todo.completed && <Check className="size-4 text-primary" aria-label="Completed" />}<Button type="button" variant="ghost" size="icon-xs" onClick={() => { if (window.confirm(`Delete “${todo.title}”? This also removes its attachments.`)) deleteTodo.mutate(todo.id, { onSuccess: () => onDeleted(todo.id) }); }} aria-label={`Delete ${todo.title}`} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></Button>
  </div>;
}

function Bucket({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const bucketDrag = useDraggable({ id: `bucket:${id}` });
  return <section ref={(node) => { setNodeRef(node); bucketDrag.setNodeRef(node); }} style={{ transform: bucketDrag.transform ? `translate3d(${bucketDrag.transform.x}px, ${bucketDrag.transform.y}px, 0)` : undefined }} className={cn("relative rounded-2xl border border-transparent px-3 transition-colors", (isOver || bucketDrag.isDragging) && "border-primary/40 bg-accent/50", bucketDrag.isDragging && "opacity-50")}><button type="button" {...bucketDrag.listeners} {...bucketDrag.attributes} aria-label="Move bucket" className="absolute right-3 top-4 cursor-grab touch-none text-muted-foreground/35 hover:text-muted-foreground"><GripVertical className="size-4" /></button><div className="min-h-10">{children}</div></section>;
}

function TaskComposer({ bucketId, day }: { bucketId?: string | null; day: string }) {
  const createTodo = useCreateTodo();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createTodo.mutate({ title, bucket: "today", bucketId: bucketId ?? undefined, scheduledFor: day }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: todosQueryOptions("today", day).queryKey }); setTitle(""); setIsOpen(false); } });
  }
  if (!isOpen) return <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="my-1 rounded-lg px-1 text-muted-foreground hover:text-secondary-foreground"><Plus className="size-3.5" /> Add a task</Button>;
  return <form onSubmit={addTask} className="my-2 flex items-center gap-2"><Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => !title && setIsOpen(false)} placeholder="New task" aria-label="New task" className="h-8 rounded-lg border-border bg-background px-2.5 text-xs shadow-none placeholder:text-muted-foreground focus-visible:border-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-muted-foreground/15" /><Button type="submit" variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-secondary-foreground"><Plus className="size-4" /></Button></form>;
}

function dateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date); }
function shiftDate(date: string, amount: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + amount); return dateKey(value); }
function dateLabel(date: string) { return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${date}T12:00:00`)); }
function dayHeading(date: string) {
  const current = dateKey(new Date());
  if (date === current) return "Today";
  if (date === shiftDate(current, -1)) return "Yesterday";
  if (date === shiftDate(current, 1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function TaskMarkdownEditor({ todo }: { todo: Todo }) {
  const { mutate: saveTodo } = useUpdateTodo();
  const [markdown, setMarkdown] = useState(todo.detailsMarkdown ?? todo.notes ?? "");
  const [saveLabel, setSaveLabel] = useState("Saved");
  const lastSavedMarkdown = useRef(markdown);

  useEffect(() => {
    if (markdown === lastSavedMarkdown.current) return;
    setSaveLabel("Saving…");
    const timer = window.setTimeout(() => saveTodo({ id: todo.id, input: { detailsMarkdown: markdown } }, { onSuccess: () => { lastSavedMarkdown.current = markdown; setSaveLabel("Saved"); }, onError: () => setSaveLabel("Couldn’t save") }), 650);
    return () => window.clearTimeout(timer);
  }, [markdown, saveTodo, todo.id]);

  return <div className="mt-8 flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} placeholder={"# Notes\n\nWrite anything here.\n\n- [ ] First small step\n- [ ] Next small step"} className="min-h-full w-full resize-none border-0 !bg-transparent px-0 py-0 text-[15px] leading-8 shadow-none placeholder:text-muted-foreground/65 focus-visible:ring-0" /></div><TaskAttachments todoId={todo.id} /><div className="pt-3 text-xs text-muted-foreground">{saveLabel} · Markdown supported</div></div>;
}

function formatBytes(size: number) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }
function TaskAttachments({ todoId }: { todoId: string }) {
  const { data: attachments = [] } = useAttachments(todoId);
  const upload = useUploadAttachment(todoId);
  const remove = useDeleteAttachment(todoId);
  return <div className="border-t border-border/70 pt-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{attachments.length ? `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}` : "No attachments"}</span><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="size-3.5" />{upload.isPending ? "Adding…" : "Attach file"}<input type="file" className="sr-only" disabled={upload.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); event.currentTarget.value = ""; }} /></label></div>{attachments.length > 0 && <ul className="mt-2 space-y-1">{attachments.map((attachment) => <li key={attachment.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/70"><Paperclip className="size-3.5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{attachment.name}</span><span className="text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span><a href={`/api/v1/attachments/${attachment.id}`} aria-label={`Download ${attachment.name}`} className="rounded p-1 text-muted-foreground hover:text-foreground"><Download className="size-3.5" /></a><button type="button" onClick={() => remove.mutate(attachment.id)} aria-label={`Remove ${attachment.name}`} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button></li>)}</ul>}</div>;
}

function TaskDetailsPanel({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [title, setTitle] = useState(todo.title);
  function saveTitle() { const nextTitle = title.trim(); if (nextTitle && nextTitle !== todo.title) updateTodo.mutate({ id: todo.id, input: { title: nextTitle } }); else if (!nextTitle) setTitle(todo.title); }
  return <motion.aside initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }} transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-30 flex min-h-screen bg-background p-0 md:sticky md:top-0 md:z-0 md:h-screen md:w-1/2 md:bg-transparent md:p-5">
    <div className="flex min-h-0 w-full flex-1 flex-col bg-card px-6 py-6 md:rounded-3xl md:px-9 md:py-8 md:shadow-[0_18px_45px_rgba(77,48,31,0.10)]"><motion.div key={todo.id} initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: "easeOut" }} className="flex min-h-0 flex-1 flex-col"><header className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">Task details</p><Input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label="Task title" className="h-auto border-0 !bg-transparent px-0 text-xl font-semibold tracking-[-0.04em] shadow-none focus-visible:ring-0" /></div><Button type="button" variant="ghost" size="icon" onClick={() => { if (window.confirm(`Delete “${todo.title}”? This also removes its attachments.`)) deleteTodo.mutate(todo.id, { onSuccess: onClose }); }} className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" aria-label="Delete task"><Trash2 className="size-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={onClose} className="size-8 shrink-0 rounded-lg text-muted-foreground"><X className="size-4" /><span className="sr-only">Close details</span></Button></header><TaskMarkdownEditor key={todo.id} todo={todo} /></motion.div></div>
  </motion.aside>;
}

export function TodayList() {
  const [day, setDay] = useState(() => dateKey(new Date()));
  const { data: todos = [], isLoading } = useTodos("today", day);
  const { data: buckets = [] } = useBuckets(day);
  const reorderTodos = useReorderTodos();
  const createBucket = useCreateBucket();
  const reorderBuckets = useReorderBuckets();
  const updateBucket = useUpdateBucket();
  const deleteBucket = useDeleteBucket();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [newBucketName, setNewBucketName] = useState("");
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const grouped = useMemo(() => new Map(buckets.map((bucket) => [bucket.id, todos.filter((todo) => todo.bucketId === bucket.id)])), [buckets, todos]);
  const unbucketedTodos = useMemo(() => todos.filter((todo) => !todo.bucketId), [todos]);

  function addBucket(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (newBucketName.trim()) createBucket.mutate({ name: newBucketName, date: day }, { onSuccess: () => { setNewBucketName(""); setIsAddingBucket(false); } }); }
  function moveTask(event: DragEndEvent) {
    if (!event.over) return;
    const activeId = String(event.active.id);
    if (activeId.startsWith("bucket:")) {
      const bucketId = activeId.slice("bucket:".length);
      const targetId = String(event.over.id);
      const targetBucketId = buckets.some((bucket) => bucket.id === targetId) ? targetId : todos.find((todo) => todo.id === targetId)?.bucketId;
      if (!targetBucketId || targetBucketId === bucketId) return;
      const reordered = [...buckets];
      const fromIndex = reordered.findIndex((bucket) => bucket.id === bucketId);
      const toIndex = reordered.findIndex((bucket) => bucket.id === targetBucketId);
      const [movedBucket] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedBucket);
      const nextBuckets = reordered.map((bucket, position) => ({ ...bucket, position }));
      queryClient.setQueryData(bucketsQueryOptions(day).queryKey, nextBuckets);
      reorderBuckets.mutate({ bucketIds: nextBuckets.map((bucket) => bucket.id), date: day });
      return;
    }
    const task = todos.find((todo) => todo.id === event.active.id); const targetTask = todos.find((todo) => todo.id === event.over?.id);
    const destination = event.over.id === "unbucketed" ? null : buckets.some((bucket) => bucket.id === event.over?.id) ? String(event.over.id) : targetTask?.bucketId;
    if (!task || destination === undefined || targetTask?.id === task.id) return;
    const destinationItems = todos.filter((todo) => todo.id !== task.id && todo.bucketId === destination); const targetIndex = targetTask ? destinationItems.findIndex((todo) => todo.id === targetTask.id) : destinationItems.length;
    destinationItems.splice(targetIndex < 0 ? destinationItems.length : targetIndex, 0, { ...task, bucketId: destination });
    const sourceItems = task.bucketId === destination ? [] : todos.filter((todo) => todo.id !== task.id && todo.bucketId === task.bucketId);
    const changed = [...sourceItems.map((todo, position) => ({ ...todo, position })), ...destinationItems.map((todo, position) => ({ ...todo, position }))];
    const nextTodos = todos.map((todo) => changed.find((item) => item.id === todo.id) ?? todo);
    queryClient.setQueryData(todosQueryOptions("today", day).queryKey, nextTodos);
    reorderTodos.mutate({ items: changed.map(({ id, bucketId, position }) => ({ id, bucketId: bucketId ?? null, position })) });
  }
  return <div className="min-h-screen md:flex"><CarryReviewDialog date={day} isToday={day === dateKey(new Date())} /><motion.section layout transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className={cn("min-w-0 flex-1 px-5 pb-16 pt-10 sm:pt-16", selectedTodo && "md:max-w-[50%]")}><div className="mx-auto w-full max-w-xl">
    <header className="mb-9 flex items-center justify-between"><div className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.04em]"><span className="grid size-6 rotate-45 place-items-center rounded-[8px] bg-primary"><span className="-rotate-45 text-[9px] text-primary-foreground">✦</span></span>UPin</div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="size-8 rounded-[10px] text-muted-foreground hover:text-foreground" aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="sm" render={<Link href="/inbox" />} className="rounded-[10px] text-muted-foreground hover:text-foreground"><Inbox className="size-4" /> Inbox</Button></div></header>
    <div className="mb-6"><div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"><Button variant="ghost" size="icon" onClick={() => setDay(shiftDate(day, -1))} className="size-6 rounded-md"><ChevronLeft className="size-3.5" /></Button><span>{dateLabel(day)}</span><Button variant="ghost" size="icon" onClick={() => setDay(shiftDate(day, 1))} className="size-6 rounded-md"><ChevronRight className="size-3.5" /></Button></div><div className="flex items-center justify-between gap-3"><h1 className="text-4xl font-semibold tracking-[-0.06em]">{dayHeading(day)}</h1>{isAddingBucket ? <form onSubmit={addBucket} className="flex items-center gap-1"><Input autoFocus value={newBucketName} onChange={(event) => setNewBucketName(event.target.value)} onBlur={() => !newBucketName && setIsAddingBucket(false)} placeholder="Bucket name" aria-label="New bucket name" className="h-8 w-28 rounded-lg border-border bg-background px-2 text-xs shadow-none" /><Button type="submit" variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground"><Plus className="size-4" /></Button></form> : <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingBucket(true)} className="rounded-lg px-1 text-xs text-muted-foreground hover:text-secondary-foreground"><Plus className="size-3.5" /> Bucket</Button>}</div></div>
    <DndContext sensors={sensors} onDragEnd={moveTask}><div className="space-y-3">{isLoading ? <p className="py-5 text-sm text-muted-foreground">Opening your list…</p> : <>{buckets.map((bucket) => { const bucketTodos = grouped.get(bucket.id) ?? []; return <Bucket key={bucket.id} id={bucket.id}><div className="mt-3 mb-2 flex items-center gap-1 pr-7"><Input aria-label={`${bucket.name} bucket name`} defaultValue={bucket.name} onBlur={(event) => { const name = event.target.value.trim(); if (name && name !== bucket.name) updateBucket.mutate({ id: bucket.id, name }); }} className="h-9 flex-1 rounded-xl border-0 !bg-background px-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground shadow-none hover:!bg-muted/60 focus-visible:!bg-card focus-visible:ring-1" /><Button type="button" variant="ghost" size="icon-xs" onClick={() => { if (window.confirm(`Delete “${bucket.name}”? Its tasks will move to Unbucketed.`)) deleteBucket.mutate(bucket.id); }} aria-label={`Delete ${bucket.name} bucket`} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></Button></div>{bucketTodos.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground/70">Nothing here yet.</p>}{bucketTodos.map((todo) => <TaskRow key={todo.id} todo={todo} onOpen={() => setSelectedTodo({ ...todo, checklist: todo.checklist ?? [] })} onDeleted={(id) => setSelectedTodo((current) => current?.id === id ? null : current)} />)}<TaskComposer bucketId={bucket.id} day={day} /></Bucket>; })}<Bucket id="unbucketed"><p className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Unbucketed</p>{unbucketedTodos.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground/70">No loose tasks.</p>}{unbucketedTodos.map((todo) => <TaskRow key={todo.id} todo={todo} onOpen={() => setSelectedTodo({ ...todo, checklist: todo.checklist ?? [] })} onDeleted={(id) => setSelectedTodo((current) => current?.id === id ? null : current)} />)}<TaskComposer day={day} /></Bucket></>}</div></DndContext>
    <p className="mt-8 text-center text-xs text-muted-foreground">Drag a task by its handle, or open it for notes and details.</p>
  </div></motion.section><AnimatePresence>{selectedTodo && <TaskDetailsPanel key="task-details" todo={selectedTodo} onClose={() => setSelectedTodo(null)} />}</AnimatePresence></div>;
}
