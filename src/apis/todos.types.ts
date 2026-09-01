export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  bucket: "today" | "inbox";
  bucketId?: string | null;
  scheduledFor?: string | null;
  detailsMarkdown?: string;
  createdAt: string;
  completedAt?: string | null;
};

export type Attachment = {
  id: string;
  todoId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type CreateTodoInput = Pick<Todo, "title" | "bucket"> &
  Partial<Pick<Todo, "bucketId">> & { scheduledFor?: string };

export type TaskScheduleInput = {
  scheduledFor: string | null;
  bucketId?: string | null;
};

export type DailyBucket = {
  id: string;
  name: string;
  position: number;
  persistent: boolean;
};
export type CarryReview = {
  reviewed: boolean;
  previousDate: string;
  tasks: Todo[];
};
