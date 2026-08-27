"use client";

import { Check, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCreateTodo, useUpdateTodo } from "@/lib/react-query/todos/todos.mutation";
import { useTodos } from "@/lib/react-query/todos/todos.query";
import { cn } from "@/lib/utils";

export function InboxList() {
  const { data: todos = [], isLoading } = useTodos("inbox");
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const [title, setTitle] = useState("");
  function addTodo(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (title.trim()) createTodo.mutate({ title, bucket: "inbox" }, { onSuccess: () => setTitle("") }); }
  return <main className="min-h-screen px-5 pb-16 pt-10 sm:pt-16"><section className="mx-auto w-full max-w-xl"><Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Today</Link><p className="mb-1 text-sm text-muted-foreground">Things to decide later</p><h1 className="mb-7 text-4xl font-semibold tracking-[-0.06em]">Inbox</h1><div className="border-y border-border">{isLoading ? <p className="py-5 text-sm text-muted-foreground">Opening Inbox…</p> : todos.map((todo) => <label key={todo.id} className="flex items-center gap-3 border-b border-border py-4 last:border-b-0"><Checkbox checked={todo.completed} onCheckedChange={(checked) => updateTodo.mutate({ id: todo.id, input: { completed: checked === true } })} className="size-5 rounded-[7px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" /><span className={cn("flex-1 text-[15px]", todo.completed && "text-muted-foreground line-through")}>{todo.title}</span>{todo.completed && <Check className="size-4 text-primary" />}</label>)}</div><form onSubmit={addTodo} className="mt-4 flex items-center gap-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add an unscheduled task" className="h-10 rounded-xl border-0 bg-accent px-3 text-sm shadow-none" /><Button type="submit" size="icon" className="size-10 rounded-xl"><Plus className="size-4" /></Button></form></section></main>;
}
