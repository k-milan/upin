# UPin MCP service

This process will expose UPin’s remote MCP endpoint behind Nginx at `/mcp`.

It must use the same task service and Postgres database as the web application. The production implementation is intentionally held until the Postgres task repository replaces the current development-only demo store; that keeps agents from receiving a misleading, non-persistent task view.
