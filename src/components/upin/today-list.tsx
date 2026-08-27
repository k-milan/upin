"use client";

import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, GripVertical, Inbox, Moon, Plus, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTodo, useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";
import { todosQueryOptions, useTodos } from "@/lib/react-query/todos/todos.query";
import { useCreateBucket, useReorderBuckets, useUpdateBucket } from "@/lib/react-query/buckets/buckets.mutation";
import { bucketsQueryOptions, useBuckets } from "@/lib/react-query/buckets/buckets.query";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

function TaskRow({ todo, onOpen }: { todo: Todo; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: todo.id });
  const updateTodo = useUpdateTodo();
  const checklist = todo.checklist ?? [];
  return <div ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} className={cn("flex items-center gap-2 border-b border-border py-3.5 last:border-b-0", isDragging && "opacity-40")}>
    <button type="button" {...listeners} {...attributes} aria-label={`Move ${todo.title}`} className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground"><GripVertical className="size-4" /></button>
    <Checkbox checked={todo.completed} onCheckedChange={(checked) => updateTodo.mutate({ id: todo.id, input: { completed: checked === true } })} className="size-5 rounded-[7px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
    <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left"><span className={cn("block text-[15px] leading-6", todo.completed && "text-muted-foreground line-through decoration-muted-foreground/50")}>{todo.title}</span>{(todo.detailsMarkdown || todo.notes || checklist.length > 0) && <span className="text-xs text-muted-foreground">Details</span>}</button>
    {todo.completed && <Check className="size-4 text-primary" aria-label="Completed" />}
  </div>;
}

function Bucket({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const bucketDrag = useDraggable({ id: `bucket:${id}` });
  return <section ref={(node) => { setNodeRef(node); bucketDrag.setNodeRef(node); }} style={{ transform: bucketDrag.transform ? `translate3d(${bucketDrag.transform.x}px, ${bucketDrag.transform.y}px, 0)` : undefined }} className={cn("relative rounded-2xl border border-transparent px-3 transition-colors", (isOver || bucketDrag.isDragging) && "border-primary/40 bg-accent/50", bucketDrag.isDragging && "opacity-50")}><button type="button" {...bucketDrag.listeners} {...bucketDrag.attributes} aria-label="Move bucket" className="absolute right-3 top-4 cursor-grab touch-none text-muted-foreground/35 hover:text-muted-foreground"><GripVertical className="size-4" /></button><div className="min-h-10">{children}</div></section>;
}

function TaskComposer({ bucketId }: { bucketId?: string | null }) {
  const createTodo = useCreateTodo();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createTodo.mutate({ title, bucket: "today", bucketId: bucketId ?? undefined }, { onSuccess: () => { setTitle(""); setIsOpen(false); } });
  }
  if (!isOpen) return <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="my-1 rounded-lg px-1 text-muted-foreground hover:text-secondary-foreground"><Plus className="size-3.5" /> Add a task</Button>;
  return <form onSubmit={addTask} className="my-2 flex items-center gap-2"><Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => !title && setIsOpen(false)} placeholder="New task" aria-label="New task" className="h-8 rounded-lg border-border bg-background px-2.5 text-xs shadow-none placeholder:text-muted-foreground focus-visible:border-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-muted-foreground/15" /><Button type="submit" variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-secondary-foreground"><Plus className="size-4" /></Button></form>;
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

  return <div className="mt-8 flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} placeholder={"# Notes\n\nWrite anything here.\n\n- [ ] First small step\n- [ ] Next small step"} className="min-h-full w-full resize-none border-0 !bg-transparent px-0 py-0 text-[15px] leading-8 shadow-none placeholder:text-muted-foreground/65 focus-visible:ring-0" /></div><div className="pt-4 text-xs text-muted-foreground">{saveLabel} · Markdown supported</div></div>;
}

function TaskDetailsPanel({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  return <motion.aside initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }} transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-30 flex min-h-screen bg-background p-0 md:sticky md:top-0 md:z-0 md:h-screen md:w-1/2 md:bg-transparent md:p-5">
    <div className="flex min-h-0 w-full flex-1 flex-col bg-card px-6 py-6 md:rounded-3xl md:px-9 md:py-8 md:shadow-[0_18px_45px_rgba(77,48,31,0.10)]"><motion.div key={todo.id} initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: "easeOut" }} className="flex min-h-0 flex-1 flex-col"><header className="flex items-start justify-between"><div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">Task details</p><h2 className="truncate text-xl font-semibold tracking-[-0.04em]">{todo.title}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose} className="size-8 shrink-0 rounded-lg text-muted-foreground"><X className="size-4" /><span className="sr-only">Close details</span></Button></header><TaskMarkdownEditor key={todo.id} todo={todo} /></motion.div></div>
  </motion.aside>;
}

export function TodayList() {
  const { data: todos = [], isLoading } = useTodos();
  const { data: buckets = [] } = useBuckets();
  const updateTodo = useUpdateTodo();
  const createBucket = useCreateBucket();
  const reorderBuckets = useReorderBuckets();
  const updateBucket = useUpdateBucket();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [newBucketName, setNewBucketName] = useState("");
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const grouped = useMemo(() => new Map(buckets.map((bucket) => [bucket.id, todos.filter((todo) => todo.bucketId === bucket.id)])), [buckets, todos]);
  const unbucketedTodos = useMemo(() => todos.filter((todo) => !todo.bucketId), [todos]);

  function addBucket(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (newBucketName.trim()) createBucket.mutate(newBucketName, { onSuccess: () => { setNewBucketName(""); setIsAddingBucket(false); } }); }
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
      queryClient.setQueryData(bucketsQueryOptions().queryKey, nextBuckets);
      reorderBuckets.mutate(nextBuckets.map((bucket) => bucket.id));
      return;
    }
    const task = todos.find((todo) => todo.id === event.active.id);
    const destination = event.over.id === "unbucketed" ? null : buckets.some((bucket) => bucket.id === event.over?.id) ? String(event.over.id) : todos.find((todo) => todo.id === event.over?.id)?.bucketId;
    if (!task || destination === undefined || task.bucketId === destination) return;
    queryClient.setQueryData(todosQueryOptions().queryKey, todos.map((todo) => todo.id === task.id ? { ...todo, bucketId: destination } : todo));
    updateTodo.mutate({ id: task.id, input: { bucketId: destination } });
  }
  return <div className="min-h-screen md:flex"><motion.section layout transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className={cn("min-w-0 flex-1 px-5 pb-16 pt-10 sm:pt-16", selectedTodo && "md:max-w-[50%]")}><div className="mx-auto w-full max-w-xl">
    <header className="mb-9 flex items-center justify-between"><div className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.04em]"><span className="grid size-6 rotate-45 place-items-center rounded-[8px] bg-primary"><span className="-rotate-45 text-[9px] text-primary-foreground">✦</span></span>UPin</div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="size-8 rounded-[10px] text-muted-foreground hover:text-foreground" aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="sm" className="rounded-[10px] text-muted-foreground hover:text-foreground"><Inbox className="size-4" /> Inbox</Button></div></header>
    <div className="mb-6"><p className="mb-1 text-sm text-muted-foreground">Thursday, August 27</p><div className="flex items-center justify-between gap-3"><h1 className="text-4xl font-semibold tracking-[-0.06em]">Today</h1>{isAddingBucket ? <form onSubmit={addBucket} className="flex items-center gap-1"><Input autoFocus value={newBucketName} onChange={(event) => setNewBucketName(event.target.value)} onBlur={() => !newBucketName && setIsAddingBucket(false)} placeholder="Bucket name" aria-label="New bucket name" className="h-8 w-28 rounded-lg border-border bg-background px-2 text-xs shadow-none" /><Button type="submit" variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground"><Plus className="size-4" /></Button></form> : <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingBucket(true)} className="rounded-lg px-1 text-xs text-muted-foreground hover:text-secondary-foreground"><Plus className="size-3.5" /> Bucket</Button>}</div></div>
    <DndContext sensors={sensors} onDragEnd={moveTask}><div className="space-y-3">{isLoading ? <p className="py-5 text-sm text-muted-foreground">Opening your list…</p> : <>{buckets.map((bucket) => <Bucket key={bucket.id} id={bucket.id}><Input aria-label={`${bucket.name} bucket name`} defaultValue={bucket.name} onBlur={(event) => { const name = event.target.value.trim(); if (name && name !== bucket.name) updateBucket.mutate({ id: bucket.id, name }); }} className="mt-3 mb-2 h-9 w-full rounded-xl border-0 !bg-background px-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground shadow-none hover:!bg-muted/60 focus-visible:!bg-card focus-visible:ring-1" />{grouped.get(bucket.id)?.map((todo) => <TaskRow key={todo.id} todo={todo} onOpen={() => setSelectedTodo({ ...todo, checklist: todo.checklist ?? [] })} />)}<TaskComposer bucketId={bucket.id} /></Bucket>)}<Bucket id="unbucketed"><p className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Unbucketed</p>{unbucketedTodos.map((todo) => <TaskRow key={todo.id} todo={todo} onOpen={() => setSelectedTodo({ ...todo, checklist: todo.checklist ?? [] })} />)}<TaskComposer /></Bucket></>}</div></DndContext>
    <p className="mt-8 text-center text-xs text-muted-foreground">Drag a task by its handle, or open it for notes and details.</p>
  </div></motion.section><AnimatePresence>{selectedTodo && <TaskDetailsPanel key="task-details" todo={selectedTodo} onClose={() => setSelectedTodo(null)} />}</AnimatePresence></div>;
}
