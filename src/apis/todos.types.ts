export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  bucket: "today" | "inbox";
  bucketId?: string | null;
  notes?: string;
  detailsMarkdown?: string;
  checklist: { id: string; text: string; completed: boolean }[];
  createdAt: string;
};

export type CreateTodoInput = Pick<Todo, "title" | "bucket"> & Partial<Pick<Todo, "bucketId">>;

export type DailyBucket = { id: string; name: string; position: number };
