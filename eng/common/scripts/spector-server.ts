import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import { runNode } from "./node-process.ts";

async function assertPortAvailable(port: number): Promise<void> {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", resolve);
  });
  await new Promise<void>((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
}

async function waitForServer(url: string, signal: AbortSignal): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    let response: Response | undefined;
    try {
      response = await fetch(`${url}/.admin/health`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2_000)]),
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      if (!(cause instanceof Error && "code" in cause && cause.code === "ECONNREFUSED")) {
        throw error;
      }
    }
    if (response) {
      if (!response.ok || (await response.json()).server !== "tsp-spector") {
        throw new Error(`Unexpected server at ${url}`);
      }
      return;
    }
    await setTimeout(250, undefined, { signal });
  }
  throw new Error(`Spector did not become ready at ${url} within 120 seconds`);
}

export async function withSpectorServer(
  args: readonly string[],
  port: number,
  action: (signal: AbortSignal) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  await assertPortAvailable(port);
  const url = `http://127.0.0.1:${port}`;
  const serverController = new AbortController();
  const workController = new AbortController();
  const workSignal = signal
    ? AbortSignal.any([signal, workController.signal])
    : workController.signal;
  let ready = false;
  let exited = false;
  const server = runNode(args, serverController.signal).finally(() => {
    exited = true;
  });
  const work = (async () => {
    await waitForServer(url, workSignal);
    ready = true;
    await action(workSignal);
  })();
  try {
    await Promise.race([
      work,
      server.then(() => {
        throw new Error("Spector exited before the test pipeline finished");
      }),
    ]);
  } finally {
    workController.abort();
    await Promise.allSettled([work]);
    try {
      if (ready && !exited) {
        // The admin endpoint flushes coverage before the process exits.
        const response = await fetch(`${url}/.admin/stop`, {
          method: "POST",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          throw new Error(`Failed to stop Spector: HTTP ${response.status}`);
        }
        await Promise.race([
          server,
          setTimeout(5_000, undefined, { ref: false }).then(() => {
            throw new Error("Spector did not exit after the stop request");
          }),
        ]);
      }
    } finally {
      serverController.abort();
      await Promise.allSettled([server]);
    }
  }
}
