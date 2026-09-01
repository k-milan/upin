"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Inbox,
  MoreVertical,
  Moon,
  Paperclip,
  PawPrint,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { Todo } from "@/apis/todos.types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownBlockEditor } from "@/components/upin/markdown-block-editor";
import { TaskScheduleControls } from "@/components/upin/task-schedule-controls";
import {
  useCreateTodo,
  useDeleteTodo,
  useReorderTodos,
  useUpdateTodo,
} from "@/lib/react-query/todos/todos.mutation";
import {
  todosQueryOptions,
  useTodos,
} from "@/lib/react-query/todos/todos.query";
import {
  useCreateBucket,
  useDeleteBucket,
  useReorderBuckets,
  useUpdateBucket,
} from "@/lib/react-query/buckets/buckets.mutation";
import {
  bucketsQueryOptions,
  useBuckets,
} from "@/lib/react-query/buckets/buckets.query";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CarryReviewDialog } from "@/components/upin/carry-review-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttachments } from "@/lib/react-query/attachments/attachments.query";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/lib/react-query/attachments/attachments.mutation";

function TaskRow({
  todo,
  onOpen,
  onDeleted,
}: {
  todo: Todo;
  onOpen: () => void;
  onDeleted: (id: string) => void;
}) {
  const taskDrag = useDraggable({ id: todo.id });
  const taskDrop = useDroppable({ id: todo.id });
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  return (
    <div
      ref={(node) => {
        taskDrag.setNodeRef(node);
        taskDrop.setNodeRef(node);
      }}
      style={{
        transform: taskDrag.transform
          ? `translate3d(${taskDrag.transform.x}px, ${taskDrag.transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        "flex items-center gap-2 border-b border-border py-3.5 last:border-b-0",
        taskDrag.isDragging && "opacity-40",
        taskDrop.isOver && !taskDrag.isDragging && "bg-muted/60",
      )}
    >
      <button
        type="button"
        {...taskDrag.listeners}
        {...taskDrag.attributes}
        aria-label={`Move ${todo.title}`}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground"
      >
        <GripVertical className="size-4" />
      </button>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) =>
          updateTodo.mutate({
            id: todo.id,
            input: { completed: checked === true },
          })
        }
        className="size-5 rounded-[7px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            "block text-[15px] leading-6",
            todo.completed &&
              "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {todo.title}
        </span>
      </button>
      {todo.completed && (
        <Check className="size-4 text-primary" aria-label="Completed" />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => {
          if (
            window.confirm(
              `Delete “${todo.title}”? This also removes its attachments.`,
            )
          )
            deleteTodo.mutate(todo.id, { onSuccess: () => onDeleted(todo.id) });
        }}
        aria-label={`Delete ${todo.title}`}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function Bucket({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const bucketDrag = useDraggable({ id: `bucket:${id}` });
  const dragHandle = (
    <button
      type="button"
      {...bucketDrag.listeners}
      {...bucketDrag.attributes}
      aria-label="Move bucket"
      className="grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded-[10px] text-muted-foreground/35 hover:bg-muted hover:text-muted-foreground"
    >
      <GripVertical className="size-3.5" />
    </button>
  );
  return (
    <section
      ref={(node) => {
        setNodeRef(node);
        bucketDrag.setNodeRef(node);
      }}
      style={{
        transform: bucketDrag.transform
          ? `translate3d(${bucketDrag.transform.x}px, ${bucketDrag.transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        "rounded-2xl border border-transparent px-3 transition-colors",
        (isOver || bucketDrag.isDragging) && "border-primary/40 bg-accent/50",
        bucketDrag.isDragging && "opacity-50",
      )}
    >
      <div className="min-h-10">{children(dragHandle)}</div>
    </section>
  );
}

function TaskComposer({
  bucketId,
  day,
  composerId,
  activeComposerId,
  setActiveComposerId,
}: {
  bucketId?: string | null;
  day: string;
  composerId: string;
  activeComposerId: string | null;
  setActiveComposerId: (id: string | null) => void;
}) {
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const isOpen = activeComposerId === composerId;
  useEffect(() => {
    if (isOpen) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (formRef.current?.contains(event.target as Node)) return;
      setTitle("");
      setActiveComposerId(null);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen, setActiveComposerId]);
  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createTodo.mutate(
      {
        title,
        bucket: "today",
        bucketId: bucketId ?? undefined,
        scheduledFor: day,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: todosQueryOptions("today", day).queryKey,
          });
          setTitle("");
          window.requestAnimationFrame(() => inputRef.current?.focus());
        },
      },
    );
  }
  if (!isOpen)
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setActiveComposerId(composerId)}
        className="my-1 rounded-lg px-1 text-muted-foreground hover:text-secondary-foreground"
      >
        <Plus className="size-3.5" /> Add a task
      </Button>
    );
  return (
    <form
      ref={formRef}
      onSubmit={addTask}
      className="my-2 flex items-center gap-2"
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="New task"
        aria-label="New task"
        className="h-8 rounded-lg border-border bg-background px-2.5 text-xs shadow-none placeholder:text-muted-foreground focus-visible:border-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-muted-foreground/15"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        onMouseDown={(event) => event.preventDefault()}
        aria-label="Add task"
        className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-secondary-foreground"
      >
        <Check className="size-4" />
      </Button>
    </form>
  );
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    date,
  );
}
function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return dateKey(value);
}
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
function dayHeading(date: string) {
  const current = dateKey(new Date());
  if (date === current) return "Today";
  if (date === shiftDate(current, -1)) return "Yesterday";
  if (date === shiftDate(current, 1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
function orderedTodos(items: Todo[]) {
  return [...items].sort(
    (left, right) =>
      Number(left.completed) - Number(right.completed) ||
      left.position - right.position,
  );
}

function TaskMarkdownEditor({ todo }: { todo: Todo }) {
  const { mutate: saveTodo } = useUpdateTodo();
  const [markdown, setMarkdown] = useState(todo.detailsMarkdown ?? "");
  const [saveLabel, setSaveLabel] = useState("Saved");
  const lastSavedMarkdown = useRef(markdown);

  useEffect(() => {
    if (markdown === lastSavedMarkdown.current) return;
    setSaveLabel("Saving…");
    const timer = window.setTimeout(
      () =>
        saveTodo(
          { id: todo.id, input: { detailsMarkdown: markdown } },
          {
            onSuccess: () => {
              lastSavedMarkdown.current = markdown;
              setSaveLabel("Saved");
            },
            onError: () => setSaveLabel("Couldn’t save"),
          },
        ),
      650,
    );
    return () => window.clearTimeout(timer);
  }, [markdown, saveTodo, todo.id]);

  return (
    <div className="mt-8 flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MarkdownBlockEditor
          value={markdown}
          onChange={setMarkdown}
          placeholder="Write anything here…"
        />
      </div>
      <TaskAttachments todoId={todo.id} />
      <div className="pt-3 text-xs text-muted-foreground">
        {saveLabel} · Markdown blocks supported
      </div>
    </div>
  );
}

function formatBytes(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}
function TaskAttachments({ todoId }: { todoId: string }) {
  const { data: attachments = [] } = useAttachments(todoId);
  const upload = useUploadAttachment(todoId);
  const remove = useDeleteAttachment(todoId);
  return (
    <div className="border-t border-border/70 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {attachments.length
            ? `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`
            : "No attachments"}
        </span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          <Paperclip className="size-3.5" />
          {upload.isPending ? "Adding…" : "Attach file"}
          <input
            type="file"
            className="sr-only"
            disabled={upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {attachments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/70"
            >
              <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
              <span className="text-muted-foreground">
                {formatBytes(attachment.sizeBytes)}
              </span>
              <a
                href={`/api/v1/attachments/${attachment.id}`}
                aria-label={`Download ${attachment.name}`}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3.5" />
              </a>
              <button
                type="button"
                onClick={() => remove.mutate(attachment.id)}
                aria-label={`Remove ${attachment.name}`}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskDetailsPanel({
  todo,
  day,
  onClose,
}: {
  todo: Todo;
  day: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed inset-0 z-30 flex min-h-screen bg-background p-0 md:sticky md:top-0 md:z-0 md:h-screen md:w-1/2 md:bg-transparent md:p-5"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col bg-card px-6 py-6 md:rounded-3xl md:px-9 md:py-8 md:shadow-[0_18px_45px_rgba(77,48,31,0.10)]">
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                Task details
              </p>
              <Input
                key={todo.id}
                defaultValue={todo.title}
                onBlur={(event) => {
                  const nextTitle = event.target.value.trim();
                  if (nextTitle && nextTitle !== todo.title)
                    updateTodo.mutate({
                      id: todo.id,
                      input: { title: nextTitle },
                    });
                  else if (!nextTitle) event.currentTarget.value = todo.title;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                aria-label="Task title"
                className="h-auto border-0 !bg-transparent px-0 text-xl font-semibold tracking-[-0.04em] shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${todo.title}”? This also removes its attachments.`,
                  )
                )
                  deleteTodo.mutate(todo.id, { onSuccess: onClose });
              }}
              className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
              aria-label="Delete task"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 shrink-0 rounded-lg text-muted-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">Close details</span>
            </Button>
          </header>
          <TaskScheduleControls
            key={todo.id}
            todo={todo}
            onScheduled={(scheduledTodo) => {
              if (scheduledTodo.scheduledFor !== day) onClose();
            }}
          />
          <TaskMarkdownEditor key={todo.id} todo={todo} />
        </div>
      </div>
    </motion.aside>
  );
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
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [newBucketName, setNewBucketName] = useState("");
  const [bucketNameToCreate, setBucketNameToCreate] = useState<string | null>(
    null,
  );
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const [activeComposerId, setActiveComposerId] = useState<string | null>(null);
  const [bucketToDelete, setBucketToDelete] = useState<{
    id: string;
    name: string;
    taskCount: number;
    persistent: boolean;
    scope: "day" | "future" | "all";
  } | null>(null);
  const grouped = useMemo(
    () =>
      new Map(
        buckets.map((bucket) => [
          bucket.id,
          orderedTodos(todos.filter((todo) => todo.bucketId === bucket.id)),
        ]),
      ),
    [buckets, todos],
  );
  const unbucketedTodos = useMemo(
    () => orderedTodos(todos.filter((todo) => !todo.bucketId)),
    [todos],
  );

  function addBucket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newBucketName.trim();
    if (name) setBucketNameToCreate(name);
  }
  function createBucketWithScope(persistent: boolean) {
    if (bucketNameToCreate)
      createBucket.mutate(
        { name: bucketNameToCreate, date: day, persistent },
        {
          onSuccess: () => {
            setNewBucketName("");
            setBucketNameToCreate(null);
            setIsAddingBucket(false);
          },
        },
      );
  }
  function moveTask(event: DragEndEvent) {
    if (!event.over) return;
    const activeId = String(event.active.id);
    if (activeId.startsWith("bucket:")) {
      const bucketId = activeId.slice("bucket:".length);
      const targetId = String(event.over.id);
      const targetBucketId = buckets.some((bucket) => bucket.id === targetId)
        ? targetId
        : todos.find((todo) => todo.id === targetId)?.bucketId;
      if (!targetBucketId || targetBucketId === bucketId) return;
      const reordered = [...buckets];
      const fromIndex = reordered.findIndex((bucket) => bucket.id === bucketId);
      const toIndex = reordered.findIndex(
        (bucket) => bucket.id === targetBucketId,
      );
      const [movedBucket] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedBucket);
      const nextBuckets = reordered.map((bucket, position) => ({
        ...bucket,
        position,
      }));
      queryClient.setQueryData(bucketsQueryOptions(day).queryKey, nextBuckets);
      reorderBuckets.mutate({
        bucketIds: nextBuckets.map((bucket) => bucket.id),
        date: day,
      });
      return;
    }
    const task = todos.find((todo) => todo.id === event.active.id);
    const targetTask = todos.find((todo) => todo.id === event.over?.id);
    const destination =
      event.over.id === "unbucketed"
        ? null
        : buckets.some((bucket) => bucket.id === event.over?.id)
          ? String(event.over.id)
          : targetTask
            ? (targetTask.bucketId ?? null)
            : undefined;
    if (!task || destination === undefined || targetTask?.id === task.id)
      return;
    const sourceBucket = task.bucketId ?? null;
    const sameBucket = sourceBucket === destination;
    const destinationItems = orderedTodos(
      todos.filter((todo) => (todo.bucketId ?? null) === destination),
    );
    if (sameBucket) {
      const fromIndex = destinationItems.findIndex(
        (todo) => todo.id === task.id,
      );
      const toIndex = targetTask
        ? destinationItems.findIndex((todo) => todo.id === targetTask.id)
        : destinationItems.length - 1;
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      const [movedTask] = destinationItems.splice(fromIndex, 1);
      destinationItems.splice(toIndex, 0, movedTask);
    } else {
      const targetIndex = targetTask
        ? destinationItems.findIndex((todo) => todo.id === targetTask.id)
        : destinationItems.length;
      destinationItems.splice(
        targetIndex < 0 ? destinationItems.length : targetIndex,
        0,
        { ...task, bucketId: destination },
      );
    }
    const sourceItems =
      sameBucket
        ? []
        : orderedTodos(
            todos.filter(
              (todo) =>
                todo.id !== task.id &&
                (todo.bucketId ?? null) === sourceBucket,
            ),
          );
    const changed = [
      ...sourceItems.map((todo, position) => ({ ...todo, position })),
      ...destinationItems.map((todo, position) => ({ ...todo, position })),
    ];
    const nextTodos = todos.map(
      (todo) => changed.find((item) => item.id === todo.id) ?? todo,
    );
    queryClient.setQueryData(
      todosQueryOptions("today", day).queryKey,
      nextTodos,
    );
    reorderTodos.mutate({
      items: changed.map(({ id, bucketId, position }) => ({
        id,
        bucketId: bucketId ?? null,
        position,
      })),
    });
  }
  return (
    <div className="min-h-screen md:flex">
      <CarryReviewDialog date={day} isToday={day === dateKey(new Date())} />
      <section
        className={cn(
          "min-w-0 flex-1 px-5 pb-16 pt-10 sm:pt-16",
          selectedTodo && "md:max-w-[50%]",
        )}
      >
        <div className="mx-auto w-full max-w-xl">
          <header className="mb-9 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.04em]">
              <span className="grid size-6 place-items-center rounded-[8px] bg-primary text-primary-foreground">
                <PawPrint className="size-3.5" strokeWidth={2.5} />
              </span>
              UPin
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setTheme(
                    hasMounted && resolvedTheme === "dark" ? "light" : "dark",
                  )
                }
                className="size-8 rounded-[10px] text-muted-foreground hover:text-foreground"
                aria-label={
                  hasMounted && resolvedTheme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {hasMounted && resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
              <Link
                href="/inbox"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className:
                    "rounded-[10px] text-muted-foreground hover:text-foreground",
                })}
              >
                <Inbox className="size-4" /> Inbox
              </Link>
            </div>
          </header>
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDay(shiftDate(day, -1))}
                className="size-6 rounded-md"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span>{dateLabel(day)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDay(shiftDate(day, 1))}
                className="size-6 rounded-md"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-4xl font-semibold tracking-[-0.06em]">
                {dayHeading(day)}
              </h1>
              {isAddingBucket ? (
                <form onSubmit={addBucket} className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={newBucketName}
                    onChange={(event) => setNewBucketName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setNewBucketName("");
                        setIsAddingBucket(false);
                      }
                    }}
                    placeholder="Bucket name"
                    aria-label="New bucket name"
                    className="h-8 w-28 rounded-lg border-border bg-background px-2 text-xs shadow-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setNewBucketName("");
                      setIsAddingBucket(false);
                    }}
                    aria-label="Cancel adding bucket"
                    className="size-8 rounded-lg text-muted-foreground"
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-muted-foreground"
                  >
                    <Plus className="size-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingBucket(true)}
                  className="rounded-lg px-1 text-xs text-muted-foreground hover:text-secondary-foreground"
                >
                  <Plus className="size-3.5" /> Bucket
                </Button>
              )}
            </div>
          </div>
          <DndContext sensors={sensors} onDragEnd={moveTask}>
            <div className="space-y-3">
              {isLoading ? (
                <p className="py-5 text-sm text-muted-foreground">
                  Opening your list…
                </p>
              ) : (
                <>
                  {buckets.map((bucket) => {
                    const bucketTodos = grouped.get(bucket.id) ?? [];
                    return (
                      <Bucket key={bucket.id} id={bucket.id}>
                        {(dragHandle) => (
                          <>
                            <div className="mt-3 mb-2 flex h-9 items-center gap-1">
                              <Input
                                aria-label={`${bucket.name} bucket name`}
                                defaultValue={bucket.name}
                                onBlur={(event) => {
                                  const name = event.target.value.trim();
                                  if (name && name !== bucket.name)
                                    updateBucket.mutate({
                                      id: bucket.id,
                                      name,
                                    });
                                }}
                                className="h-9 flex-1 rounded-xl border-0 !bg-background px-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground shadow-none hover:!bg-muted/60 focus-visible:!bg-card focus-visible:ring-1"
                              />
                              <div className="flex shrink-0 items-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={`${bucket.name} bucket menu`}
                                        className="text-muted-foreground"
                                      />
                                    }
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                  >
                                    {bucket.persistent && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setBucketToDelete({
                                              id: bucket.id,
                                              name: bucket.name,
                                              taskCount: bucketTodos.length,
                                              persistent: true,
                                              scope: "day",
                                            })
                                          }
                                        >
                                          Remove from this day
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setBucketToDelete({
                                              id: bucket.id,
                                              name: bucket.name,
                                              taskCount: bucketTodos.length,
                                              persistent: true,
                                              scope: "future",
                                            })
                                          }
                                        >
                                          Remove from this day onward
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() =>
                                        setBucketToDelete({
                                          id: bucket.id,
                                          name: bucket.name,
                                          taskCount: bucketTodos.length,
                                          persistent: bucket.persistent,
                                          scope: bucket.persistent
                                            ? "all"
                                            : "day",
                                        })
                                      }
                                    >
                                      <Trash2 className="size-3.5" />
                                      {bucket.persistent
                                        ? "Delete bucket everywhere"
                                        : "Delete for this day"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {dragHandle}
                              </div>
                            </div>
                            {bucketTodos.length === 0 && (
                              <p className="px-1 py-2 text-xs text-muted-foreground/70">
                                Nothing here yet.
                              </p>
                            )}
                            {bucketTodos.map((todo) => (
                              <TaskRow
                                key={todo.id}
                                todo={todo}
                                onOpen={() => setSelectedTodo(todo)}
                                onDeleted={(id) =>
                                  setSelectedTodo((current) =>
                                    current?.id === id ? null : current,
                                  )
                                }
                              />
                            ))}
                            <TaskComposer
                              bucketId={bucket.id}
                              day={day}
                              composerId={bucket.id}
                              activeComposerId={activeComposerId}
                              setActiveComposerId={setActiveComposerId}
                            />
                          </>
                        )}
                      </Bucket>
                    );
                  })}
                  <Bucket id="unbucketed">
                    {(dragHandle) => (
                      <>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Unbucketed
                          </p>
                          {dragHandle}
                        </div>
                        {unbucketedTodos.length === 0 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground/70">
                            No loose tasks.
                          </p>
                        )}
                        {unbucketedTodos.map((todo) => (
                          <TaskRow
                            key={todo.id}
                            todo={todo}
                            onOpen={() => setSelectedTodo(todo)}
                            onDeleted={(id) =>
                              setSelectedTodo((current) =>
                                current?.id === id ? null : current,
                              )
                            }
                          />
                        ))}
                        <TaskComposer
                          day={day}
                          composerId="unbucketed"
                          activeComposerId={activeComposerId}
                          setActiveComposerId={setActiveComposerId}
                        />
                      </>
                    )}
                  </Bucket>
                </>
              )}
            </div>
          </DndContext>
        </div>
      </section>
      <AnimatePresence>
        {selectedTodo && (
          <TaskDetailsPanel
            key="task-details"
            todo={selectedTodo}
            day={day}
            onClose={() => setSelectedTodo(null)}
          />
        )}
      </AnimatePresence>
      <Dialog
        open={Boolean(bucketNameToCreate)}
        onOpenChange={(open) => {
          if (!open) setBucketNameToCreate(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Where should this bucket appear?</DialogTitle>
            <DialogDescription>
              “{bucketNameToCreate}” can stay on {dateLabel(day)} or appear every
              day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createBucket.isPending}
              onClick={() => createBucketWithScope(false)}
            >
              This day
            </Button>
            <Button
              type="button"
              disabled={createBucket.isPending}
              onClick={() => createBucketWithScope(true)}
            >
              Every day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(bucketToDelete)}
        onOpenChange={(open) => {
          if (!open) setBucketToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bucketToDelete?.scope === "day" && bucketToDelete.persistent
                ? `Remove “${bucketToDelete.name}” from this day?`
                : bucketToDelete?.scope === "future"
                  ? `Remove “${bucketToDelete.name}” from this day onward?`
                  : `Delete “${bucketToDelete?.name}” everywhere?`}
            </DialogTitle>
            <DialogDescription>
              {bucketToDelete?.scope === "all"
                ? "This removes the bucket from every day, including its history. Its tasks will remain and move to Unbucketed."
                : bucketToDelete?.scope === "future"
                  ? `Earlier days stay unchanged. Tasks from ${dateLabel(day)} onward will move to Unbucketed.`
                : bucketToDelete?.taskCount
                  ? `${bucketToDelete.taskCount} task${bucketToDelete.taskCount === 1 ? "" : "s"} on this day will move to Unbucketed.`
                  : "The bucket will no longer appear on this day."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBucketToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBucket.isPending}
              onClick={() =>
                bucketToDelete &&
                deleteBucket.mutate(
                  {
                    id: bucketToDelete.id,
                    date: day,
                    scope: bucketToDelete.scope,
                  },
                  { onSuccess: () => setBucketToDelete(null) },
                )
              }
            >
              {bucketToDelete?.scope === "day" && bucketToDelete.persistent
                ? "Remove from this day"
                : bucketToDelete?.scope === "future"
                  ? "Remove from this day onward"
                  : "Delete everywhere"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
