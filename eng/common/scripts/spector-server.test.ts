import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { ProcessFailedError, runNode } from "./node-process.ts";
import { withSpectorServer } from "./spector-server.ts";

const fixture = fileURLToPath(new URL("./test-fixtures/spector-server.ts", import.meta.url));

async function unusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

test("waits for readiness and gracefully stops the server after a client failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "typespec-spector-"));
  const coverage = join(directory, "coverage");
  const port = await unusedPort();
  try {
    await assert.rejects(
      withSpectorServer([fixture, String(port), coverage], port, async (signal) => {
        const response = await fetch(`http://127.0.0.1:${port}/.admin/health`);
        assert.equal(response.status, 200);
        await runNode(["--eval", "process.exit(7)"], signal);
      }),
      (error: unknown) => {
        assert.ok(error instanceof ProcessFailedError);
        assert.equal(error.exitCode, 7);
        return true;
      },
    );
    assert.equal(await readFile(coverage, "utf8"), "coverage flushed");
    await assert.rejects(fetch(`http://127.0.0.1:${port}/.admin/health`));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("refuses an occupied port without stopping the existing server", async () => {
  const existing = createServer((_request, response) => response.end("existing server"));
  await new Promise<void>((resolve) => existing.listen(0, "127.0.0.1", resolve));
  const address = existing.address();
  assert.ok(address && typeof address !== "string");
  try {
    await assert.rejects(
      withSpectorServer([fixture, String(address.port)], address.port, async () => {
        assert.fail("Tests must not run against an existing server");
      }),
      { code: "EADDRINUSE" },
    );
    const response = await fetch(`http://127.0.0.1:${address.port}`);
    assert.equal(await response.text(), "existing server");
  } finally {
    await new Promise<void>((resolve) => existing.close(() => resolve()));
  }
});

test.skipIf(process.platform === "win32")(
  "interruption cancels test workers and flushes coverage before exiting",
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "typespec-spector-"));
    const coverage = join(directory, "coverage");
    const port = await unusedPort();
    const pipeline = fileURLToPath(new URL("./test-fixtures/spector-pipeline.ts", import.meta.url));
    const child = spawn(process.execPath, [pipeline, String(port), coverage], {
      stdio: "inherit",
    });
    const exited = new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          await fetch(`http://127.0.0.1:${port}/.admin/health`);
          break;
        } catch (error) {
          if (attempt >= 100) throw error;
          await setTimeout(10);
        }
      }
      // Wait until the pipeline has observed readiness and entered the test action.
      const started = join(directory, "started");
      for (let attempt = 0; ; attempt++) {
        try {
          await readFile(started);
          break;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT" || attempt >= 100) throw error;
          await setTimeout(10);
        }
      }
      child.kill("SIGTERM");
      assert.equal(await exited, 143);
      assert.equal(await readFile(coverage, "utf8"), "coverage flushed");
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
        await exited;
      }
      await rm(directory, { recursive: true, force: true });
    }
  },
);
