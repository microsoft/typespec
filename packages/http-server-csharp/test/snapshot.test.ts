import { existsSync, readdirSync, statSync } from "fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, relative, sep } from "path";
import { expect, it } from "vitest";
import { EmitterTester } from "./test-host.js";

const libraryName = "@typespec/http-server-csharp";
const snapshotDir = join(import.meta.dirname, "snapshots/sample-service");

/** Normalize path separators to forward slashes for cross-platform consistency. */
function normalizePath(p: string): string {
  return sep === "\\" ? p.replaceAll("\\", "/") : p;
}

/** Collect snapshot paths, excluding local .NET build output. */
function listFilesRecursive(root: string, dir: string = root): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "bin" || entry === "obj") continue;
      results.push(...listFilesRecursive(root, full));
    } else {
      results.push(normalizePath(relative(root, full)));
    }
  }
  return results;
}

it("ignores .NET build directories without hiding stale source snapshots", async () => {
  const root = await mkdtemp(join(tmpdir(), "typespec-csharp-snapshots-"));
  try {
    for (const path of [
      "Program.cs",
      "stale.cs",
      "bin/Debug/net9.0/ServiceProject.dll",
      "obj/Debug/net9.0/ServiceProject.AssemblyInfo.cs",
      "nested/obj/project.assets.json",
      "nested/Keep.cs",
    ]) {
      const full = join(root, path);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, "");
    }

    expect(listFilesRecursive(root).sort()).toEqual(["Program.cs", "nested/Keep.cs", "stale.cs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

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
