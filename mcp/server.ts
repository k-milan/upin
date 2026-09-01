import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import {
  carryForwardPersistentTodos,
  createPersistentTodo,
  deletePersistentTodo,
  listPersistentBuckets,
  listPersistentTodos,
  schedulePersistentTodo,
  updatePersistentTodo,
} from "../src/lib/todos/repository";
import { removeAttachment } from "../src/lib/attachments/storage";

const dateSchema = z.string().date();

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function failure(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function createUpinMcpServer() {
  const server = new McpServer({ name: "upin", version: "0.1.0" });

  server.registerTool(
    "list_today_tasks",
    {
      title: "List today tasks",
      description:
        "List tasks planned for a UPin day. Defaults to today in Asia/Manila.",
      inputSchema: {
        date: dateSchema
          .optional()
          .describe("Day to list, formatted YYYY-MM-DD."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ date }) => result(await listPersistentTodos("today", date)),
  );

  server.registerTool(
    "list_inbox_tasks",
    {
      title: "List inbox tasks",
      description: "List unscheduled tasks in the UPin inbox.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => result(await listPersistentTodos("inbox")),
  );

  server.registerTool(
    "list_buckets",
    {
      title: "List day buckets",
      description: "List the available buckets for a specific UPin day.",
      inputSchema: {
        date: dateSchema.describe(
          "Day whose buckets to list, formatted YYYY-MM-DD.",
        ),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ date }) => result(await listPersistentBuckets(date)),
  );

  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description: "Create a task in the inbox or on a specified UPin day.",
      inputSchema: {
        title: z.string().trim().min(1).max(280).describe("Task title."),
        date: dateSchema
          .optional()
          .describe(
            "Schedule this task for this day. Omit to add it to the inbox.",
          ),
        bucketId: z
          .string()
          .uuid()
          .optional()
          .describe("Optional bucket on the selected day. Requires date."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ title, date, bucketId }) => {
      if (bucketId && !date)
        return failure("A bucket requires a scheduled date.");
      try {
        return result(
          await createPersistentTodo({
            title,
            bucket: date ? "today" : "inbox",
            scheduledFor: date,
            bucketId,
          }),
        );
      } catch (error) {
        return failure(
          error instanceof Error ? error.message : "Could not create task.",
        );
      }
    },
  );

  server.registerTool(
    "schedule_task",
    {
      title: "Schedule or unschedule task",
      description:
        "Move a task to a specific day and optional bucket, or move it to the Inbox by setting date to null.",
      inputSchema: {
        taskId: z.string().uuid().describe("UPin task ID."),
        date: dateSchema
          .nullable()
          .describe("Target day, or null to move the task to Inbox."),
        bucketId: z
          .string()
          .uuid()
          .nullable()
          .optional()
          .describe("Optional bucket belonging to the target day."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ taskId, date, bucketId }) => {
      try {
        const task = await schedulePersistentTodo(taskId, date, bucketId);
        return task ? result(task) : failure("Task not found.");
      } catch (error) {
        return failure(
          error instanceof Error ? error.message : "Could not schedule task.",
        );
      }
    },
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete task",
      description:
        "Permanently delete a UPin task and all of its attachments. Only call this after the user has explicitly confirmed deletion.",
      inputSchema: {
        taskId: z.string().uuid().describe("UPin task ID to permanently delete."),
        confirm: z
          .literal(true)
          .describe("Must be true to confirm permanent deletion."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async ({ taskId }) => {
      const deleted = await deletePersistentTodo(taskId);
      if (!deleted) return failure("Task not found.");
      await Promise.all(
        deleted.attachments.map((attachment) =>
          removeAttachment(attachment.storageKey),
        ),
      );
      return result({ deleted: true, task: deleted.todo });
    },
  );

  server.registerTool(
    "carry_forward_tasks",
    {
      title: "Carry tasks forward",
      description:
        "Move selected unfinished tasks to a target day now, without waiting for the next-day review.",
      inputSchema: {
        taskIds: z
          .array(z.string().uuid())
          .min(1)
          .describe("Unfinished task IDs to carry forward."),
        targetDate: dateSchema.describe(
          "Day to move the tasks to, formatted YYYY-MM-DD.",
        ),
        bucketId: z
          .string()
          .uuid()
          .nullable()
          .optional()
          .describe("Optional bucket belonging to the target day."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ taskIds, targetDate, bucketId }) => {
      try {
        return result(
          await carryForwardPersistentTodos(taskIds, targetDate, bucketId),
        );
      } catch (error) {
        return failure(
          error instanceof Error
            ? error.message
            : "Could not carry tasks forward.",
        );
      }
    },
  );

  server.registerTool(
    "set_task_completion",
    {
      title: "Set task completion",
      description: "Mark a task complete or incomplete.",
      inputSchema: {
        taskId: z.string().uuid().describe("UPin task ID."),
        completed: z.boolean().describe("Whether the task is complete."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ taskId, completed }) => {
      const task = await updatePersistentTodo(taskId, { completed });
      return task ? result(task) : failure("Task not found.");
    },
  );

  server.registerTool(
    "update_task_details",
    {
      title: "Update task details",
      description:
        "Replace a task's Markdown details. Use this only after the user has supplied or approved the new details.",
      inputSchema: {
        taskId: z.string().uuid().describe("UPin task ID."),
        detailsMarkdown: z
          .string()
          .max(20_000)
          .describe("Complete Markdown details to save."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ taskId, detailsMarkdown }) => {
      const task = await updatePersistentTodo(taskId, { detailsMarkdown });
      return task ? result(task) : failure("Task not found.");
    },
  );

  return server;
}
