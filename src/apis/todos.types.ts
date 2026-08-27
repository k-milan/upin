export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  bucket: "today" | "inbox";
  bucketId?: string | null;
  scheduledFor?: string | null;
  notes?: string;
  detailsMarkdown?: string;
  checklist: { id: string; text: string; completed: boolean }[];
  createdAt: string;
};

export type CreateTodoInput = Pick<Todo, "title" | "bucket"> & Partial<Pick<Todo, "bucketId">> & { scheduledFor?: string };

export type DailyBucket = { id: string; name: string; position: number };
export type CarryReview = { reviewed: boolean; previousDate: string; tasks: Todo[] };
