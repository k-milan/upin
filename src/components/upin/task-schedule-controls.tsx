"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBuckets } from "@/lib/react-query/buckets/buckets.query";
import { useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";

export function TaskScheduleControls({
  todo,
  onScheduled,
}: {
  todo: Todo;
  onScheduled?: (todo: Todo) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-muted-foreground"
            aria-label="Reschedule task"
            title="Reschedule task"
          />
        }
      >
        <CalendarDays className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule task</DialogTitle>
          <DialogDescription>
            Choose a day and bucket for this task.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ScheduleFields
            todo={todo}
            onScheduled={(scheduledTodo) => {
              setOpen(false);
              onScheduled?.(scheduledTodo);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScheduleFields({
  todo,
  onScheduled,
}: {
  todo: Todo;
  onScheduled: (todo: Todo) => void;
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
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveSchedule();
      }}
    >
      <label className="grid gap-2 text-sm font-medium">
        Scheduled day
        <DatePicker
          value={date}
          onChange={(selectedDate) => {
            setDate(selectedDate);
            setBucketId("");
          }}
          aria-label="Scheduled day"
          className="w-full"
          disabled={updateTodo.isPending}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Task bucket
        <select
          value={bucketId}
          onChange={(event) => setBucketId(event.target.value)}
          disabled={!date || isLoading || updateTodo.isPending}
          aria-label="Task bucket"
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        >
          <option value="">Unbucketed</option>
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-end gap-2">
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
          type="submit"
          size="sm"
          disabled={!date || updateTodo.isPending}
          className="h-8 shrink-0 px-3 text-xs"
        >
          {updateTodo.isPending ? "Saving…" : "Apply"}
        </Button>
      </div>
    </form>
  );
}
