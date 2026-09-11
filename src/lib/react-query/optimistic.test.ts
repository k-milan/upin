import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { optimisticList, currentDay } from "./optimistic";
import { belongsToList } from "./todos/todos.mutation";
import type { Todo } from "@/apis/todos.types";

test("failed changes do not undo later successful edits", async () => {
  const client = new QueryClient();
  const key = ["items"];
  client.setQueryData(key, [{ id: "a", title: "original", completed: false }]);
  type Item = { id: string; title: string; completed: boolean };
  const first = await optimisticList<Item>(client, "items", (items) =>
    items.map((item) => ({ ...item, title: "changed" })),
  );
  const second = await optimisticList<Item>(client, "items", (items) =>
    items.map((item) => ({ ...item, completed: true })),
  );
  await second.finish(false);
  assert.equal(client.getQueryState(key)?.isInvalidated, false);
  await first.finish(true);
  assert.deepEqual(client.getQueryData(key), [
    { id: "a", title: "original", completed: true },
  ]);
  assert.equal(client.getQueryState(key)?.isInvalidated, true);
  client.clear();
});

test("failed delete restores an item while retaining another edit", async () => {
  const client = new QueryClient();
  const key = ["items"];
  client.setQueryData(key, [1, 2]);
  const deletion = await optimisticList<number>(client, "items", (items) =>
    items.filter((id) => id !== 1),
  );
  const addition = await optimisticList<number>(client, "items", (items) => [
    ...items,
    3,
  ]);
  assert.deepEqual(client.getQueryData(key), [2, 3]);
  await deletion.finish(true);
  assert.deepEqual(client.getQueryData(key), [1, 2, 3]);
  await addition.finish(false);
  client.clear();
});

test("creation replaces a temporary ID with the confirmed item", async () => {
  const client = new QueryClient();
  client.setQueryData(["items"], ["existing"]);
  const creation = await optimisticList<string>(client, "items", (items) => [
    ...items,
    "pending",
  ]);
  assert.deepEqual(client.getQueryData(["items"]), ["existing", "pending"]);
  await creation.finish(false, (items) => [...items, "server-id"]);
  assert.deepEqual(client.getQueryData(["items"]), ["existing", "server-id"]);
  client.clear();
});

test("task membership follows current, future and archived queries", () => {
  const todo: Todo = {
    id: "a",
    title: "Task",
    completed: false,
    position: 0,
    bucket: "today",
    createdAt: new Date().toISOString(),
  };
  const current = ["todos", "list", "today", currentDay(), "current"];
  const future = ["todos", "list", "today", "2099-01-01", "current"];
  assert.equal(belongsToList(todo, current), true);
  assert.equal(belongsToList(todo, future), false);
  const scheduled = { ...todo, scheduledFor: "2099-01-01" };
  assert.equal(belongsToList(scheduled, current), false);
  assert.equal(belongsToList(scheduled, future), true);
  const completed = {
    ...todo,
    completed: true,
    completedAt: "2020-01-01T00:00:00Z",
  };
  assert.equal(belongsToList(completed, current), false);
  assert.equal(
    belongsToList(completed, [
      "todos",
      "list",
      "inbox",
      currentDay(),
      "archived",
    ]),
    true,
  );
  assert.equal(
    belongsToList({ ...completed, completed: false }, current),
    true,
  );
});
