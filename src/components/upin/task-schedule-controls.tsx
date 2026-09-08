"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuckets } from "@/lib/react-query/buckets/buckets.query";
import { useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";

export function TaskScheduleControls({
  todo,
  onScheduled,
}: {
  todo: Todo;
  onScheduled?: (todo: Todo) => void;
}) {
  const updateTodo = useUpdateTodo();
  const [date, setDate] = useState(todo.scheduledFor ?? "");
  const [bucketId, setBucketId] = useState(todo.bucketId ?? "");
  const [savedDate, setSavedDate] = useState(todo.scheduledFor ?? "");
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
          onScheduled?.(scheduledTodo);
        },
      },
    );
  }

  function makeActive() {
    updateTodo.mutate(
      { id: todo.id, input: { scheduledFor: null, bucketId: null } },
      {
        onSuccess: (scheduledTodo) => {
          setSavedDate("");
          setDate("");
          setBucketId("");
          onScheduled?.(scheduledTodo);
        },
      },
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
      <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
      <Input
        type="date"
        value={date}
        onChange={(event) => {
          setDate(event.target.value);
          setBucketId("");
        }}
        aria-label="Scheduled day"
        className="h-8 w-36 shrink-0 rounded-lg bg-background px-2 text-xs shadow-none"
      />
      <select
        value={bucketId}
        onChange={(event) => setBucketId(event.target.value)}
        disabled={!date || isLoading}
        aria-label="Task bucket"
        className="h-8 w-32 shrink-0 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
      >
        <option value="">Unbucketed</option>
        {buckets.map((bucket) => (
          <option key={bucket.id} value={bucket.id}>
            {bucket.name}
          </option>
        ))}
      </select>
      {savedDate ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={updateTodo.isPending}
          onClick={makeActive}
          className="h-8 shrink-0 px-2 text-xs text-muted-foreground"
        >
          Make active now
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        disabled={!date || updateTodo.isPending}
        onClick={saveSchedule}
        className="h-8 shrink-0 px-3 text-xs"
      >
        Apply
      </Button>
    </div>
  );
}
