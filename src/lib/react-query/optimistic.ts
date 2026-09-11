import type { QueryClient, QueryKey } from "@tanstack/react-query";

type Transform = (data: unknown, key: QueryKey) => unknown;
type Layer = { transform: Transform; settled: boolean; failed: boolean };
type Batch = {
  snapshots: Map<string, { key: QueryKey; data: unknown }>;
  layers: Layer[];
};
const batches = new WeakMap<QueryClient, Map<string, Batch>>();

// Replay pending changes over the original cache so one failed request cannot
// undo another successful (or still pending) action.
export async function optimisticList<T>(
  client: QueryClient,
  root: string,
  transform: (items: T[], key: QueryKey) => T[],
) {
  await client.cancelQueries({ queryKey: [root] });
  let roots = batches.get(client);
  if (!roots) batches.set(client, (roots = new Map()));
  let batch = roots.get(root);
  if (!batch) {
    batch = { snapshots: new Map(), layers: [] };
    roots.set(root, batch);
  }
  for (const [key, data] of client.getQueriesData({ queryKey: [root] })) {
    const hash = JSON.stringify(key);
    if (data !== undefined && !batch.snapshots.has(hash))
      batch.snapshots.set(hash, { key, data });
  }
  const wrap =
    (fn: typeof transform): Transform =>
    (data, key) =>
      fn(data as T[], key);
  const layer: Layer = {
    transform: wrap(transform),
    settled: false,
    failed: false,
  };
  batch.layers.push(layer);
  const replay = () => {
    for (const { key, data } of batch.snapshots.values()) {
      client.setQueryData(
        key,
        batch.layers.reduce(
          (value, entry) =>
            entry.failed ? value : entry.transform(value, key),
          data,
        ),
      );
    }
  };
  replay();
  return {
    async finish(failed: boolean, confirmed?: typeof transform) {
      layer.failed = failed;
      layer.settled = true;
      if (confirmed) layer.transform = wrap(confirmed);
      replay();
      if (batch.layers.every((entry) => entry.settled)) {
        roots.delete(root);
        await client.invalidateQueries({ queryKey: [root] });
      }
    },
  };
}

export function currentDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    new Date(),
  );
}
