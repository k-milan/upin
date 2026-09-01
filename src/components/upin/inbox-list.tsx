"use client";

import {
  Archive,
  Check,
  ChevronLeft,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import type { Todo } from "@/apis/todos.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TaskScheduleControls } from "@/components/upin/task-schedule-controls";
import {
  useCreateTodo,
  useDeleteTodo,
  useUpdateTodo,
} from "@/lib/react-query/todos/todos.mutation";
import { useTodos } from "@/lib/react-query/todos/todos.query";
import { cn } from "@/lib/utils";

export function InboxList() {
  const { data: todos = [], isLoading } = useTodos("inbox");
  const [showArchived, setShowArchived] = useState(false);
  const { data: archivedTodos = [], isLoading: isLoadingArchived } = useTodos(
    "inbox",
    undefined,
    { archived: true, enabled: showArchived },
  );
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [title, setTitle] = useState("");

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createTodo.mutate(
      { title, bucket: "inbox" },
      { onSuccess: () => setTitle("") },
    );
  }

  function taskRow(todo: Todo) {
    return (
      <div
        key={todo.id}
        className="border-b border-border py-4 last:border-b-0"
      >
        <div className="flex items-center gap-3">
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
          <Input
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
            aria-label="Task title"
            className={cn(
              "h-auto flex-1 border-0 !bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0",
              todo.completed && "text-muted-foreground line-through",
            )}
          />
          {todo.completed && <Check className="size-4 text-primary" />}
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
                deleteTodo.mutate(todo.id);
            }}
            aria-label={`Delete ${todo.title}`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <TaskScheduleControls todo={todo} compact />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-16 pt-10 sm:pt-16">
      <section className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Today
        </Link>
        <p className="mb-1 text-sm text-muted-foreground">
          Things to decide later
        </p>
        <h1 className="mb-7 text-4xl font-semibold tracking-[-0.06em]">
          Inbox
        </h1>
        <div className="border-y border-border">
          {isLoading ? (
            <p className="py-5 text-sm text-muted-foreground">Opening Inbox…</p>
          ) : (
            todos.map(taskRow)
          )}
        </div>
        <form onSubmit={addTodo} className="mt-4 flex items-center gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add an unscheduled task"
            className="h-10 rounded-xl border-0 bg-accent px-3 text-sm shadow-none"
          />
          <Button type="submit" size="icon" className="size-10 rounded-xl">
            <Plus className="size-4" />
          </Button>
        </form>
        <div className="mt-8 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowArchived((value) => !value)}
            aria-expanded={showArchived}
            className="h-9 gap-2 px-2 text-muted-foreground"
          >
            {showArchived ? (
              <ChevronUp className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          {showArchived && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Archived
              </p>
              <div className="border-y border-border">
                {isLoadingArchived ? (
                  <p className="py-5 text-sm text-muted-foreground">
                    Opening archive…
                  </p>
                ) : archivedTodos.length ? (
                  archivedTodos.map(taskRow)
                ) : (
                  <p className="py-5 text-sm text-muted-foreground">
                    No archived tasks yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
