import {
  CompilerHost,
  NodeHost,
  compile,
  getDirectoryPath,
  joinPaths,
  resolvePath,
} from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { fail, strictEqual } from "assert";
import { readdirSync } from "fs";
import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { RunnerTestFile, RunnerTestSuite, afterAll, beforeAll, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../../../src/lib.js";
import { worksFor } from "./../../works-for.js";

const shouldUpdateSnapshots = process.env.RECORD === "true";

export interface SpecSnapshotTestOptions {
  /**  Spec root directory. */
  specDir: string;

  /** Output directory for snapshots. */
  outputDir: string;

  /** Folders to exclude from testing. */
  exclude?: string[];
}

export interface TestContext {
  runCount: number;
  registerSnapshot(filename: string): void;
}
export function defineSpecTests(config: SpecSnapshotTestOptions) {
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
  worksFor(["3.0.0", "3.1.0"], ({ openApiForFile }) => {
    specs.forEach((spec) => defineSpecTest(context, config, spec, openApiForFile));
  });
}

function defineSpecTest(
  context: TestContext,
  config: SpecSnapshotTestOptions,
  spec: Spec,
  openApiForFile: (spec: Spec) => Promise<typeof openApiForFile>,
) {
  it(spec.name, async () => {
    context.runCount++;
    const results = await openApiForFile(spec);
    if (shouldUpdateSnapshots) {
      //await cleanUpDir(config.outputDir, Object.entries(results));

      for (const [snapshotPath, content] of Object.entries(results)) {
        const outputPath = resolvePath(config.outputDir, snapshotPath);
        try {
          await mkdir(getDirectoryPath(outputPath), { recursive: true });
          await writeFile(outputPath, JSON.stringify(content));
          context.registerSnapshot(resolvePath(spec.name, snapshotPath));
        } catch (e) {
          throw new Error(`Failure to write snapshot: "${outputPath}"\n Error: ${e}`);
        }
      }
    } else {
      for (const [snapshotPath, content] of Object.entries(results)) {
        const outputPath = resolvePath(config.outputDir, snapshotPath);
        let existingContent;
        try {
          existingContent = await readFile(outputPath);
        } catch (e: unknown) {
          if (isEnoentError(e)) {
            fail(`Snapshot "${outputPath}" is missing. Run with RECORD=true to regenerate it.`);
          }
          throw e;
        }
        context.registerSnapshot(resolvePath(spec.name, snapshotPath));
        strictEqual(JSON.stringify(content), existingContent.toString());
      }
    }
  });
}

interface SpecSnapshotTestHost extends CompilerHost {
  outputs: Map<string, string>;
}

function createSpecTestHost(): SpecSnapshotTestHost {
  const outputs = new Map<string, string>();
  return {
    ...NodeHost,
    outputs,
    mkdirp: (path: string) => Promise.resolve(path),
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
  const excludes = new Set(config.exclude);
  walk("");
  return specs;

  function walk(relativeDir: string) {
    if (excludes.has(relativeDir)) {
      return;
    }
    const fullDir = joinPaths(config.specDir, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(joinPaths(relativeDir, entry.name));
      } else if (relativeDir && entry.name === "main.tsp") {
        specs.push({
          name: relativeDir,
          fullPath: joinPaths(config.specDir, relativeDir),
        });
      }
    }
  }
}

function isEnoentError(e: unknown): e is { code: "ENOENT" } {
  return typeof e === "object" && e !== null && "code" in e;
}

export async function openApiForFile(spec: Spec, options: OpenAPI3EmitterOptions = {}) {
  const host = createSpecTestHost();
  const program = await compile(host, spec.fullPath, {
    noEmit: false,
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options, "file-type": "json" } },
  });
  expectDiagnosticEmpty(program.diagnostics);
  const openApiVersion = options["openapi-versions"]?.[0] ?? "3.0.0";
  const output: any = {};
  for (const [path, content] of host.outputs.entries()) {
    const snapshotPath = resolvePath(openApiVersion, spec.name, path);
    output[snapshotPath] = JSON.parse(content);
  }
  return output;
}
