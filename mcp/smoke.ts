import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.UPIN_MCP_URL ?? "http://127.0.0.1:3333/mcp");
const client = new Client({ name: "upin-mcp-smoke", version: "0.1.0" });

async function main() {
  await client.connect(new StreamableHTTPClientTransport(url));
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  const expected = [
    "carry_forward_tasks",
    "create_task",
    "list_buckets",
    "list_inbox_tasks",
    "list_today_tasks",
    "schedule_task",
    "set_task_completion",
    "update_task_details",
  ];

  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected tool list: ${names.join(", ")}`);
  }

  const today = await client.callTool({
    name: "list_today_tasks",
    arguments: {},
  });
  if (today.isError) {
    throw new Error("The task repository could not list today’s tasks.");
  }

  console.log(`MCP smoke check passed: ${names.join(", ")}`);
  await client.close();
}

void main();
