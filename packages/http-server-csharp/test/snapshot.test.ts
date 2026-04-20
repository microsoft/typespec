import { existsSync, readdirSync, statSync } from "fs";
import { readFile } from "fs/promises";
import { join, relative, sep } from "path";
import { expect, it } from "vitest";
import { EmitterTester } from "./test-host.js";

const libraryName = "@typespec/http-server-csharp";
const snapshotDir = join(import.meta.dirname, "snapshots/sample-service");

/** Normalize path separators to forward slashes for cross-platform consistency. */
function normalizePath(p: string): string {
  return sep === "\\" ? p.replaceAll("\\", "/") : p;
}

/** Recursively collect all file paths relative to `root`, using forward slashes. */
function listFilesRecursive(root: string, dir: string = root): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...listFilesRecursive(root, full));
    } else {
      results.push(normalizePath(relative(root, full)));
    }
  }
  return results;
}

it("sample-service full output", async () => {
  const sampleServicePath = join(import.meta.dirname, "snapshots/sample-service.tsp");
  const sampleCode = await readFile(sampleServicePath, "utf-8");

  const runner = await EmitterTester.createInstance();
  const [result, diagnostics] = await runner.compileAndDiagnose(sampleCode, {
    compilerOptions: {
      options: {
        [libraryName]: {
          "skip-format": true,
          "emit-mocks": "mocks-and-project-files",
        },
      },
    },
  });

  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    throw new Error(`Compilation errors:\n${errors.map((e) => `  ${e.message}`).join("\n")}`);
  }

  const ignoredFiles = new Set(["Properties/launchSettings.json"]);
  const sortedPaths = Object.keys(result.outputs)
    .filter((p) => !ignoredFiles.has(p))
    .sort();

  // Snapshot each file so diffs are easy to read in PRs
  for (const path of sortedPaths) {
    await expect(result.outputs[path]).toMatchFileSnapshot(join(snapshotDir, path));
  }

  // Check for stale snapshot files that are no longer emitted
  const existingFiles = listFilesRecursive(snapshotDir).sort();
  const staleFiles = existingFiles.filter((f) => !sortedPaths.includes(f));
  expect(staleFiles, "Stale snapshot files found — delete them or update the emitter").toEqual([]);
});
