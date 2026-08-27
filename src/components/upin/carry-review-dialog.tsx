"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCarryReview, useCompleteCarryReview } from "@/lib/react-query/reviews/reviews.query";

export function CarryReviewDialog({ date, isToday }: { date: string; isToday: boolean }) {
  const { data } = useCarryReview(date); const complete = useCompleteCarryReview(); const [selected, setSelected] = useState<string[]>([]);
  const open = isToday && Boolean(data && !data.reviewed && data.tasks.length);
  if (!data) return null;
  const finish = (ids: string[]) => complete.mutate({ date, todoIds: ids });
  return <Dialog open={open}><DialogContent showCloseButton={false} className="rounded-2xl sm:max-w-md"><DialogHeader><DialogTitle>Bring anything forward?</DialogTitle><DialogDescription>These were unfinished on {data.previousDate}. Choose what belongs in today.</DialogDescription></DialogHeader><div className="space-y-2">{data.tasks.map((todo) => <label key={todo.id} className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3 text-sm"><Checkbox checked={selected.includes(todo.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, todo.id] : current.filter((id) => id !== todo.id))} /><span>{todo.title}</span></label>)}</div><div className="mt-2 grid grid-cols-3 gap-2"><Button variant="ghost" onClick={() => finish([])} className="rounded-xl">None</Button><Button variant="secondary" onClick={() => finish(selected)} className="rounded-xl">Selected</Button><Button onClick={() => finish(data.tasks.map((todo) => todo.id))} className="rounded-xl">Carry all</Button></div></DialogContent></Dialog>;
}
