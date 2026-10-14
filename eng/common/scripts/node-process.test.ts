import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { test } from "vitest";
import { ProcessFailedError, runParallel } from "./node-process.ts";

test("waits for every successful parallel process", async () => {
  const directory = await mkdtemp(join(tmpdir(), "typespec-process-"));
  const output = join(directory, "finished");
  try {
    await runParallel([
      ["--eval", "process.exit(0)"],
      [
        "--eval",
        `setTimeout(() => require("node:fs").writeFileSync(${JSON.stringify(output)}, "done"), 100)`,
      ],
    ]);
    assert.equal(await readFile(output, "utf8"), "done");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("propagates failure and terminates sibling processes and their descendants", async () => {
  const directory = await mkdtemp(join(tmpdir(), "typespec-process-"));
  const output = join(directory, "pid");
  try {
    const running = runParallel([
      [
        "--eval",
        `const child = require("node:child_process").spawn(process.execPath, ["--eval", "setInterval(() => {}, 1000)"], { stdio: "ignore" }); require("node:fs").writeFileSync(${JSON.stringify(output)}, String(child.pid)); setInterval(() => {}, 1000);`,
      ],
      [
        "--eval",
        `const fs = require("node:fs"); const timer = setInterval(() => { if (fs.existsSync(${JSON.stringify(output)})) { clearInterval(timer); process.exit(7); } }, 10);`,
      ],
    ]);
    await assert.rejects(running, (error: unknown) => {
      assert.ok(error instanceof ProcessFailedError);
      assert.equal(error.exitCode, 7);
      return true;
    });
    const pid = Number(await readFile(output, "utf8"));
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        process.kill(pid, 0);
      } catch (error) {
        assert.equal((error as NodeJS.ErrnoException).code, "ESRCH");
        return;
      }
      await setTimeout(10);
    }
    assert.fail("The sibling's descendant is still running");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("watch mode stops siblings when one process exits successfully", async () => {
  await runParallel(
    [
      ["--eval", "process.exit(0)"],
      ["--eval", "setInterval(() => {}, 1000)"],
    ],
    undefined,
    true,
  );
});
