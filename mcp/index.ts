import { createServer } from "node:http";

import { loadEnvConfig } from "@next/env";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createUpinMcpServer } from "./server";

loadEnvConfig(process.cwd());

const host = process.env.UPIN_MCP_HOST ?? "127.0.0.1";
const port = Number(process.env.UPIN_MCP_PORT ?? 3333);

function sendMethodNotAllowed(response: import("node:http").ServerResponse) {
  response.writeHead(405, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }),
  );
}

const httpServer = createServer(async (request, response) => {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? host}`,
  );
  if (url.pathname !== "/mcp") {
    response.writeHead(404).end();
    return;
  }

  if (request.method !== "POST") {
    sendMethodNotAllowed(response);
    return;
  }

  const mcpServer = createUpinMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(request, response);
    response.once(
      "close",
      () => void Promise.all([transport.close(), mcpServer.close()]),
    );
  } catch (error) {
    console.error("Unable to handle MCP request", error);
    if (!response.headersSent) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        }),
      );
    }
  }
});

httpServer.listen(port, host, () => {
  console.log(`UPin MCP server listening at http://${host}:${port}/mcp`);
});

async function shutdown() {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
