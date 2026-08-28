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

The server exposes task-listing, task creation, completion, and Markdown-detail tools. It does not expose destructive deletion tools.

## Deployment

Run `pnpm mcp:start` as a separate process beside Next.js. Keep it bound to `127.0.0.1` (the default), and let Nginx proxy the public `/mcp` route to `http://127.0.0.1:3333/mcp`.

Do not publish this unauthenticated version. Add OAuth before routing public traffic from ChatGPT or Claude to it.
