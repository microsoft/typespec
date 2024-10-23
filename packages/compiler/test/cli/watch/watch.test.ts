import { deepStrictEqual } from "assert";
import { WatchEventType, mkdirSync } from "fs";
import { appendFile, mkdir, rm } from "fs/promises";
import { afterEach, beforeAll, describe, it } from "vitest";
import { ProjectWatcher, createWatcher } from "../../../src/core/cli/actions/compile/watch.js";
import { getDirectoryPath, resolvePath } from "../../../src/index.js";
import { findTestPackageRoot } from "../../../src/testing/test-utils.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);

const fixtureRoot = resolvePath(pkgRoot, "temp/test/cli/watcher");

function fixturePath(path: string) {
  return resolvePath(fixtureRoot, path);
}

class FixtureFS {
  async modify(path: string, delay?: number): Promise<string> {
    const realPath = fixturePath(path);
    await this.#maybeDelay(async () => {
      mkdirSync(getDirectoryPath(realPath), { recursive: true });
      await appendFile(realPath, new Date().toISOString());
    }, delay);
    return realPath;
  }

  async rm(path: string, delay?: number): Promise<string> {
    const realPath = fixturePath(path);
    await this.#maybeDelay(async () => {
      mkdirSync(getDirectoryPath(realPath), { recursive: true });
      await rm(realPath);
    }, delay);
    return realPath;
  }

  #delayTimers: NodeJS.Timeout[] = [];
  #maybeDelay(fn: () => Promise<void>, delay: number | undefined) {
    if (delay) {
      return new Promise((resolve, reject) => {
        this.#delayTimers.push(
          setTimeout(() => {
            fn().then(resolve).catch(reject);
          }, delay),
        );
      });
    } else {
      return fn();
    }
  }

  clearDelayTimers() {
    this.#delayTimers.forEach(clearTimeout);
    this.#delayTimers.length = 0;
  }
}

describe("compiler: watch", () => {
  let watcher: ProjectWatcher;
  let fixtures: FixtureFS;
  let changes: [WatchEventType, string][];

  beforeAll(async () => {
    try {
      await rm(fixtureRoot, { recursive: true });
    } catch {}
    await mkdir(fixtureRoot, { recursive: true });

    fixtures = new FixtureFS();
    changes = [];
    watcher = createWatcher((evt, name) => {
      changes.push([evt, name]);
    });
  });

  afterEach(() => {
    watcher.close();
    fixtures.clearDelayTimers();
  });

  it("should watch a single file and keep watching", async () => {
    const file1 = await fixtures.modify("single/file1.txt");
    watcher.updateWatchedFiles([file1]);
    deepStrictEqual(changes, [], "Should not report change in initial load.");
    await fixtures.modify("single/file1.txt", 100);

    await delay(100);
    deepStrictEqual(changes, [["change", file1]]);

    await fixtures.modify("single/file1.txt", 100);
    await delay(100);
    deepStrictEqual(changes, [
      ["change", file1],
      ["change", file1],
    ]);
  });

  it("should watch multiple files", async () => {
    const file1 = await fixtures.modify("multiple/sub-folder0/file1.txt");
    const file2 = await fixtures.modify("multiple/sub-folder1/file2.txt");
    const file3 = await fixtures.modify("multiple/sub-folder2/file3.txt");
    watcher.updateWatchedFiles([file1, file2, file3]);
    await delay(100);
    changes = [];
    deepStrictEqual(changes, [], "Should not report change in initial load.");
    await fixtures.modify("multiple/sub-folder1/file2.txt", 100);

    await delay(100);
    deepStrictEqual(changes, [["change", file2]]);

    await fixtures.modify("multiple/sub-folder2/file3.txt", 100);
    await delay(100);
    deepStrictEqual(changes, [
      ["change", file2],
      ["change", file3],
    ]);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
