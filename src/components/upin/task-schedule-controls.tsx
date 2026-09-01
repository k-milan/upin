"use client";

import { CalendarDays, ChevronDown, Inbox } from "lucide-react";
import { useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuckets } from "@/lib/react-query/buckets/buckets.query";
import { useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";
import { cn } from "@/lib/utils";

export function TaskScheduleControls({
  todo,
  compact = false,
  onScheduled,
}: {
  todo: Todo;
  compact?: boolean;
  onScheduled?: (todo: Todo) => void;
}) {
  const updateTodo = useUpdateTodo();
  const [date, setDate] = useState(todo.scheduledFor ?? "");
  const [bucketId, setBucketId] = useState(todo.bucketId ?? "");
  const [savedDate, setSavedDate] = useState(todo.scheduledFor ?? "");
  const [savedBucketId, setSavedBucketId] = useState(todo.bucketId ?? "");
  const [open, setOpen] = useState(false);
  const { data: buckets = [], isLoading } = useBuckets(
    date || undefined,
    Boolean(date),
  );

  function saveSchedule() {
    if (!date) return;
    updateTodo.mutate(
      {
        id: todo.id,
        input: { scheduledFor: date, bucketId: bucketId || null },
      },
      {
        onSuccess: (scheduledTodo) => {
          setSavedDate(scheduledTodo.scheduledFor ?? "");
          setSavedBucketId(scheduledTodo.bucketId ?? "");
          setOpen(false);
          onScheduled?.(scheduledTodo);
        },
      },
    );
  }

  function moveToInbox() {
    updateTodo.mutate(
      { id: todo.id, input: { scheduledFor: null, bucketId: null } },
      {
        onSuccess: (scheduledTodo) => {
          setSavedDate("");
          setSavedBucketId("");
          setOpen(false);
          onScheduled?.(scheduledTodo);
        },
      },
    );
  }

  const savedBucket = buckets.find((bucket) => bucket.id === savedBucketId);
  const scheduleLabel = savedDate
    ? `${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${savedDate}T12:00:00Z`))} · ${savedBucket?.name ?? "Unbucketed"}`
    : "Schedule";

  function toggleEditor() {
    setDate(savedDate);
    setBucketId(savedBucketId);
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }

  return (
    <div
      className={cn(
        "relative",
        compact ? "mt-1.5 pl-8" : "mt-3",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleEditor}
        aria-expanded={open}
        className="h-7 gap-1.5 rounded-lg px-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
      >
        <CalendarDays className="size-3.5" />
        {scheduleLabel}
        <ChevronDown
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div className="mt-1.5 w-full max-w-xs rounded-xl border border-border bg-popover p-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setBucketId("");
              }}
              aria-label="Scheduled day"
              className="h-8 min-w-0 flex-1 rounded-lg bg-background px-2 text-xs shadow-none"
            />
            <select
              value={bucketId}
              onChange={(event) => setBucketId(event.target.value)}
              disabled={!date || isLoading}
              aria-label="Task bucket"
              className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
            >
              <option value="">Unbucketed</option>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            {savedDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={updateTodo.isPending}
                onClick={moveToInbox}
                className="mr-auto h-7 px-2 text-xs text-muted-foreground"
              >
                <Inbox className="size-3.5" /> Move to Inbox
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!date || updateTodo.isPending}
              onClick={saveSchedule}
              className="h-7 px-3 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
