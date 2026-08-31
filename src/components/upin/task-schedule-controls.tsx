"use client";

import { CalendarDays, Inbox } from "lucide-react";
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
      { onSuccess: onScheduled },
    );
  }

  function moveToInbox() {
    updateTodo.mutate(
      { id: todo.id, input: { scheduledFor: null, bucketId: null } },
      { onSuccess: onScheduled },
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "mt-2 pl-8" : "mt-4 rounded-xl bg-muted/55 p-2.5",
      )}
    >
      <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
      <Input
        type="date"
        value={date}
        onChange={(event) => {
          setDate(event.target.value);
          setBucketId("");
        }}
        aria-label="Scheduled day"
        className="h-8 w-[9.5rem] rounded-lg bg-background px-2 text-xs shadow-none"
      />
      <select
        value={bucketId}
        onChange={(event) => setBucketId(event.target.value)}
        disabled={!date || isLoading}
        aria-label="Task bucket"
        className="h-8 min-w-28 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
      >
        <option value="">Unbucketed</option>
        {buckets.map((bucket) => (
          <option key={bucket.id} value={bucket.id}>
            {bucket.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!date || updateTodo.isPending}
        onClick={saveSchedule}
      >
        {todo.scheduledFor ? "Save" : "Schedule"}
      </Button>
      {todo.scheduledFor && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={updateTodo.isPending}
          onClick={moveToInbox}
        >
          <Inbox className="size-3.5" /> Inbox
        </Button>
      )}
    </div>
  );
}
