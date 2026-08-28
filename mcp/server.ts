import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import {
  createPersistentTodo,
  listPersistentTodos,
  updatePersistentTodo,
} from "../src/lib/todos/repository";

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
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ title, date }) =>
      result(
        await createPersistentTodo({
          title,
          bucket: date ? "today" : "inbox",
          scheduledFor: date,
        }),
      ),
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
