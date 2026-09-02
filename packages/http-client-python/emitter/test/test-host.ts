import type { Diagnostic } from "@typespec/compiler";
import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import jsyaml from "js-yaml";
import { tmpdir } from "os";
import { join } from "path";
import { $onEmit } from "../src/emitter.js";

const PythonTester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: ["@azure-tools/typespec-client-generator-core"],
});

export const Tester = PythonTester;

// `@typespec/http-client-python` is intentionally excluded from the pnpm workspace, so it isn't
// linked into its own `node_modules` and `.emit()` can't resolve it by name. Register a minimal
// virtual package whose entrypoint re-exports the real `$onEmit`, so the emitter under test runs.
export const EmitterTester = PythonTester.files({
  "node_modules/@typespec/http-client-python/package.json": JSON.stringify({
    name: "@typespec/http-client-python",
    version: "0.0.0",
    exports: { ".": "./index.js" },
  }),
  "node_modules/@typespec/http-client-python/index.js": mockFile.js({
    $onEmit,
  }),
}).emit("@typespec/http-client-python", {
  "generate-packaging-files": false,
});

/** A type entry in the emitted code model. */
export interface CodeModelType {
  type: string;
  name?: string;
}

/** The subset of the emitted code model that the emitter tests assert against. */
export interface CodeModel {
  clients: unknown[];
  types: CodeModelType[];
}

/**
 * Run the emitter's TypeScript step only (via `emit-yaml-only`) and return the code model it
 * produced along with any diagnostics. This stops right after `emitCodeModel`, so it exercises the
 * real emitter logic that decides what gets generated without booting the Python/Pyodide generator.
 */
export async function emitCodeModel(
  code: string,
): Promise<{ codeModel: CodeModel; diagnostics: readonly Diagnostic[] }> {
  const outputDir = await mkdtemp(join(tmpdir(), "typespec-python-"));
  let yamlPath: string | undefined;
  try {
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(code, {
      compilerOptions: {
        options: {
          "@typespec/http-client-python": {
            "emit-yaml-only": true,
            "emitter-output-dir": outputDir,
          },
        },
      },
    });

    // `emit-yaml-only` writes a `.tsp-codegen-*.json` pointer into the output dir that references
    // the serialized code model YAML written to the OS temp dir.
    const pointerName = (await readdir(outputDir)).find(
      (name) => name.startsWith(".tsp-codegen-") && name.endsWith(".json"),
    );
    if (!pointerName) {
      throw new Error("Emitter did not produce a code model.");
    }
    ({ yamlPath } = JSON.parse(
      await readFile(join(outputDir, pointerName), "utf-8"),
    ));
    const codeModel = jsyaml.load(
      await readFile(yamlPath!, "utf-8"),
    ) as CodeModel;
    return { codeModel, diagnostics };
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    if (yamlPath) {
      await rm(yamlPath, { force: true });
    }
  }
}
