import {
  CompilerHost,
  NodeHost,
  getDirectoryPath,
  getRelativePathFromDirectory,
  joinPaths,
  resolvePath,
} from "@typespec/compiler";
import { fail, ok, strictEqual } from "assert";
import { readdirSync } from "fs";
import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { RunnerTestFile, RunnerTestSuite, afterAll, beforeAll, it } from "vitest";
import { convertAction } from "../../../src/cli/actions/convert/convert-file.js";

const shouldUpdateSnapshots = process.env.RECORD === "true";

export interface SpecSnapshotTestOptions {
  /**  Spec root directory. */
  specDir: string;

  /** Output directory for snapshots. */
  outputDir: string;
}

export interface TestContext {
  runCount: number;
  registerSnapshot(filename: string): void;
}
export function defineSpecSnaphotTests(config: SpecSnapshotTestOptions) {
  const specs = resolveSpecs(config);
  let existingSnapshots: string[];
  const writtenSnapshots: string[] = [];
  const context = {
    runCount: 0,
    registerSnapshot(filename: string) {
      writtenSnapshots.push(filename);
    },
  };
  beforeAll(async () => {
    existingSnapshots = await readFilesInDirRecursively(config.outputDir);
  });

  afterAll(async function (context: Readonly<RunnerTestSuite | RunnerTestFile>) {
    if (context.tasks.some((x) => x.mode === "skip")) {
      return; // Not running the full test suite, so don't bother checking snapshots.
    }

    const missingSnapshots = new Set<string>(existingSnapshots);
    for (const writtenSnapshot of writtenSnapshots) {
      missingSnapshots.delete(writtenSnapshot);
    }
    if (missingSnapshots.size > 0) {
      if (shouldUpdateSnapshots) {
        for (const file of [...missingSnapshots].map((x) => joinPaths(config.outputDir, x))) {
          await rm(file);
        }
      } else {
        const snapshotList = [...missingSnapshots].map((x) => `  ${x}`).join("\n");
        fail(
          `The following snapshot are still present in the output dir but were not generated:\n${snapshotList}\n Run with RECORD=true to regenerate them.`,
        );
      }
    }
  });
  specs.forEach((specs) => defineSpecSnaphotTest(context, config, specs));
}

function defineSpecSnaphotTest(context: TestContext, config: SpecSnapshotTestOptions, spec: Spec) {
  it(spec.name, async () => {
    context.runCount++;
    const host = createSpecSnapshotTestHost(config);

    const outputDir = resolvePath(config.outputDir, spec.name);

    await convertAction(host as any, { "output-dir": outputDir, path: spec.fullPath });

    if (shouldUpdateSnapshots) {
      try {
        await host.rm(outputDir, { recursive: true });
      } catch (e) {}
      await mkdir(outputDir, { recursive: true });

      for (const [snapshotPath, content] of host.outputs.entries()) {
        const relativePath = getRelativePathFromDirectory(outputDir, snapshotPath, false);

        try {
          await mkdir(getDirectoryPath(snapshotPath), { recursive: true });
          await writeFile(snapshotPath, content);
          context.registerSnapshot(resolvePath(spec.name, relativePath));
        } catch (e) {
          throw new Error(`Failure to write snapshot: "${snapshotPath}"\n Error: ${e}`);
        }
      }
    } else {
      for (const [snapshotPath, content] of host.outputs.entries()) {
        const relativePath = getRelativePathFromDirectory(outputDir, snapshotPath, false);
        let existingContent;
        try {
          existingContent = await readFile(snapshotPath);
        } catch (e: unknown) {
          if (isEnoentError(e)) {
            fail(`Snapshot "${snapshotPath}" is missing. Run with RECORD=true to regenerate it.`);
          }
          throw e;
        }
        context.registerSnapshot(resolvePath(spec.name, relativePath));
        strictEqual(content, existingContent.toString());
      }

      for (const filename of await readFilesInDirRecursively(outputDir)) {
        const snapshotPath = resolvePath(outputDir, filename);
        ok(
          host.outputs.has(snapshotPath),
          `Snapshot for "${snapshotPath}" was not emitted. Run with RECORD=true to remove it.`,
        );
      }
    }
  });
}

interface SpecSnapshotTestHost extends CompilerHost {
  outputs: Map<string, string>;
}

function createSpecSnapshotTestHost(config: SpecSnapshotTestOptions): SpecSnapshotTestHost {
  const outputs = new Map<string, string>();
  return {
    ...NodeHost,
    outputs,
    mkdirp: (path: string) => Promise.resolve(path),
    rm: (path: string) => Promise.resolve(),
    writeFile: async (path: string, content: string) => {
      outputs.set(path, content);
    },
  };
}
async function readFilesInDirRecursively(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (isEnoentError(e)) {
      return [];
    } else {
      throw new Error(`Failed to read dir "${dir}"\n Error: ${e}`);
    }
  }
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const file of await readFilesInDirRecursively(resolvePath(dir, entry.name))) {
        files.push(resolvePath(entry.name, file));
      }
    } else {
      files.push(entry.name);
    }
  }
  return files;
}

interface Spec {
  name: string;
  /** Spec folder */
  fullPath: string;
}

function resolveSpecs(config: SpecSnapshotTestOptions): Spec[] {
  const specs: Spec[] = [];
  walk("");
  return specs;

  function walk(relativeDir: string) {
    const fullDir = joinPaths(config.specDir, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(joinPaths(relativeDir, entry.name));
      } else if (relativeDir && (entry.name === "service.yml" || entry.name === "service.json")) {
        specs.push({
          name: relativeDir,
          fullPath: joinPaths(config.specDir, relativeDir, entry.name),
        });
      }
    }
  }
}

function isEnoentError(e: unknown): e is { code: "ENOENT" } {
  return typeof e === "object" && e !== null && "code" in e;
}
