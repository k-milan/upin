# UPin MCP service

UPin exposes a stateless Streamable HTTP MCP server at `/mcp`. It uses the same PostgreSQL task repository as the web application; it intentionally does not use the development in-memory store.

## Run locally

Start PostgreSQL and apply the schema migration first, then run:

```bash
pnpm mcp:dev
```

The local endpoint is `http://127.0.0.1:3333/mcp`. In a separate terminal, confirm that MCP clients can discover the tools:

```bash
pnpm mcp:smoke
```

The server exposes task and bucket listing, task creation, day/bucket scheduling, early carry-forward, completion, Markdown-detail, and task-deletion tools. Setting a task's schedule date to `null` moves it to the Inbox. `delete_task` permanently removes the task and its attachments, is marked destructive, and requires `confirm: true` after explicit user confirmation.

## Deployment

Run `pnpm mcp:start` as a separate process beside Next.js. Keep it bound to `127.0.0.1` (the default), and let Nginx proxy the public `/mcp` route to `http://127.0.0.1:3333/mcp`.

Do not publish this unauthenticated version. Add OAuth before routing public traffic from ChatGPT or Claude to it.
