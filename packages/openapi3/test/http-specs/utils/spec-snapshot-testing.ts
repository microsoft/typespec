import { BASIC } from "@hyperjump/json-schema/experimental";
import { registerSchema, unregisterSchema, validate } from "@hyperjump/json-schema/openapi-3-0";
import { validate as validateV31 } from "@hyperjump/json-schema/openapi-3-1";
import {
  CompilerHost,
  NodeHost,
  compile,
  getDirectoryPath,
  joinPaths,
  resolvePath,
} from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { deepStrictEqual, fail } from "assert";
import { readdirSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { RunnerTestFile, RunnerTestSuite, afterAll, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../../../src/lib.js";
import { worksFor } from "./../../works-for.js";

const shouldUpdateSnapshots = process.env.RECORD === "true";
const BASE_PATH = "http://localhost:3000";
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
  const writtenSnapshots: string[] = [];
  const context = {
    runCount: 0,
    registerSnapshot(filename: string) {
      writtenSnapshots.push(filename);
    },
  };

  afterAll(async function (context: Readonly<RunnerTestSuite | RunnerTestFile>) {
    if (context.tasks.some((x) => x.mode === "skip")) {
      return; // Not running the full test suite, so don't bother checking snapshots.
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
          await writeFile(outputPath, prettierOutput(JSON.stringify(content, null, 2)));
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
        deepStrictEqual(JSON.parse(existingContent.toString()), content);
        //strictEqual(prettierOutput(JSON.stringify(content, null, 2)), existingContent.toString());
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
    const jsonContent = JSON.parse(content);
    await validateOpenAPI3(jsonContent);

    output[snapshotPath] = jsonContent;
  }
  return output;
}

export async function markCoverage(path: string, options: Record<string, any>) {
  try {
    const response = await fetch(BASE_PATH + path, options);
    const body = await response.json();
    return { status: response.status, body: body };
  } catch (e) {
    return null;
  }
}

export async function checkServe() {
  const interval = 1000; // 1 second
  const timeout = 10000; // 10 seconds

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await fetch(BASE_PATH);
      return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

export async function validataDataWithSchema(data: any, schemaData: any) {
  unregisterSchema("https://example.com/schema1");
  registerSchema(
    {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...schemaData,
    },
    "https://example.com/schema1",
  );
  const result = await validate("https://example.com/schema1", data);
  if (!result.valid) {
    const errors = result.errors?.map((r) => JSON.stringify(r)).join("\n");
    fail(`Failed to validate OpenAPI3 schema with @hyperjump/json-schema.\n${errors}`);
  }
}
async function validateOpenAPI3(jsonContent: any) {
  const schemaUrl =
    jsonContent.openapi === "3.0.0"
      ? "https://spec.openapis.org/oas/3.0/schema"
      : "https://spec.openapis.org/oas/3.1/schema-base";
  const result = await (jsonContent.openapi === "3.0.0" ? validate : validateV31)(
    schemaUrl,
    jsonContent,
    BASIC,
  );
  if (!result.valid) {
    const errors = result.errors?.map((r) => JSON.stringify(r)).join("\n");
    fail(`Failed to validate OpenAPI3 schema with @hyperjump/json-schema.\n${errors}`);
  }
}

function prettierOutput(output: string) {
  return output + "\n";
}
