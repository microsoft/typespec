import { getRelativePathFromDirectory, joinPaths, resolvePath } from "@typespec/compiler";
import { type ResolveModuleHost, resolveModule } from "@typespec/compiler/module-resolver";
import { fail, ok, strictEqual } from "assert";
import { readdirSync } from "fs";
import { readFile, readdir, realpath, rm, stat } from "fs/promises";
import { pathToFileURL } from "url";
import { RunnerTestFile, RunnerTestSuite, afterAll, beforeAll, it } from "vitest";
import { getOpenAPI3 } from "../../../src/openapi.js";

const shouldUpdateSnapshots = false;

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

export async function importTypeSpecLibrary(baseDir: string): Promise<any> {
  try {
    const host: ResolveModuleHost = {
      realpath,
      readFile: async (path: string) => await readFile(path, "utf-8"),
      stat,
    };
    const resolved = await resolveModule(host, "@typespec/compiler", {
      baseDir,
      conditions: ["import"],
    });
    return import(
      pathToFileURL(resolved.type === "module" ? resolved.mainFile : resolved.path).toString()
    );
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      return import("@typespec/compiler");
    } else {
      throw err;
    }
  }
}

function defineSpecSnaphotTest(context: TestContext, config: SpecSnapshotTestOptions, spec: Spec) {
  it(spec.name, async () => {
    context.runCount++;
    const outputDir = resolvePath(config.outputDir, spec.name);
    const typespecCompiler = await importTypeSpecLibrary(config.specDir);

    const options = shouldUpdateSnapshots
      ? {
          additionalImports: ["@typespec/spector", "@typespec/xml"],
          noEmit: false,
          emit: ["@typespec/openapi3"],
          warningAsError: false,
          options: {
            "@typespec/openapi3": { "emitter-output-dir": outputDir, "file-type": "json" },
          },
        }
      : {
          additionalImports: ["@typespec/spector", "@typespec/xml"],
          noEmit: false,
          emit: ["@typespec/openapi3"],
          warningAsError: false,
        };
    const program = await typespecCompiler.compile(
      typespecCompiler.NodeHost,
      spec.fullPath,
      options,
    );
    if (!shouldUpdateSnapshots) {
      const outputs = new Set<string>();
      const services = await getOpenAPI3(program, { "omit-unreachable-types": false });
      for (const serviceRecord of services) {
        if (serviceRecord.versioned) {
          for (const documentRecord of serviceRecord.versions) {
            const snapshotFileName = "openapi." + documentRecord.version + ".json";
            const snapshotPath = resolvePath(outputDir, snapshotFileName);
            const relativePath = getRelativePathFromDirectory(
              config.outputDir,
              snapshotPath,
              false,
            );
            context.registerSnapshot(resolvePath(spec.name, relativePath));
            await assertResult(snapshotPath, serializeDocument(documentRecord.document));
            outputs.add(snapshotPath);
          }
        } else {
          const snapshotFileName = "openapi.json";
          const snapshotPath = resolvePath(outputDir, snapshotFileName);
          const relativePath = getRelativePathFromDirectory(config.outputDir, snapshotPath, false);
          context.registerSnapshot(resolvePath(spec.name, relativePath));
          await assertResult(snapshotPath, serializeDocument(serviceRecord.document));
          outputs.add(snapshotPath);
        }
      }

      for (const filename of await readFilesInDirRecursively(outputDir)) {
        const snapshotPath = resolvePath(outputDir, filename);
        ok(
          outputs.has(snapshotPath),
          `Snapshot for "${snapshotPath}" was not emitted. Run with RECORD=true to remove it.`,
        );
      }
    }
  });
}

async function assertResult(snapshotPath: any, expected: any) {
  let existingContent;
  try {
    existingContent = await readFile(snapshotPath);
  } catch (e: unknown) {
    if (isEnoentError(e)) {
      fail(`Snapshot "${snapshotPath}" is missing. Run with RECORD=true to regenerate it.`);
    }
    throw e;
  }

  strictEqual(expected, existingContent.toString());
}

function prettierOutput(output: string) {
  return output + "\n";
}

function serializeDocument(root: any): string {
  sortOpenAPIDocument(root);
  return prettierOutput(JSON.stringify(root, null, 2));
}

function sortObjectByKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((sortedObj: any, key: string) => {
      sortedObj[key] = obj[key];
      return sortedObj;
    }, {});
}

function sortOpenAPIDocument(doc: any): void {
  doc.paths = sortObjectByKeys(doc.paths);
  if (doc.components?.schemas) {
    doc.components.schemas = sortObjectByKeys(doc.components.schemas);
  }
  if (doc.components?.parameters) {
    doc.components.parameters = sortObjectByKeys(doc.components.parameters);
  }
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
      } else if (relativeDir && entry.name === "main.tsp") {
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
