import { CompilerHost, NodeHost, compile, joinPaths, resolvePath } from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { readdirSync } from "fs";
import { RunnerTestFile, RunnerTestSuite, afterAll, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../../../src/lib.js";
import { worksFor } from "./../../works-for.js";

export interface SpecSnapshotTestOptions {
  /**  Spec root directory. */
  specDir: string;

  /** Folders to exclude from testing. */
  exclude?: string[];
}

export interface TestContext {
  runCount: number;
}
export function defineSpecTests(config: SpecSnapshotTestOptions) {
  const specs = resolveSpecs(config);
  const context = {
    runCount: 0,
  };

  afterAll(async function (context: Readonly<RunnerTestSuite | RunnerTestFile>) {
    if (context.tasks.some((x) => x.mode === "skip")) {
      return; // Not running the full test suite, so don't bother checking snapshots.
    }
  });
  worksFor(["3.0.0", "3.1.0"], ({ openApiForFile }) => {
    specs.forEach((spec) => defineSpecTest(context, spec, openApiForFile));
  });
}

function defineSpecTest(
  context: TestContext,
  spec: Spec,
  openApiForFile: (spec: Spec) => Promise<typeof openApiForFile>,
) {
  it(spec.name, async () => {
    context.runCount++;
    await openApiForFile(spec);
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

export async function openApiForFile(spec: Spec, options: OpenAPI3EmitterOptions = {}) {
  const host = createSpecTestHost();
  const program = await compile(host, spec.fullPath, {
    noEmit: false,
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options, "file-type": "json" } },
  });
  expectDiagnosticEmpty(program.diagnostics);
  const openApiVersion = options["openapi-versions"]?.[0];
  const output: any = {};
  for (const [path, content] of host.outputs.entries()) {
    const snapshotPath = resolvePath(spec.name, openApiVersion, path);
    output[snapshotPath] = JSON.parse(content);
  }
  return output;
}
