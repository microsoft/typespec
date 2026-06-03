// Browser stub for `node-runner.ts`. Swapped in via the `"browser"` field in
// `package.json`. The emitter's browser flow short-circuits before reaching
// `runNodeEmit`, so this stub is defense-in-depth — if it does get called,
// surface a clear diagnostic rather than a cryptic missing-module error.

import type { EmitContext } from "@typespec/compiler";
import { NoTarget } from "@typespec/compiler";
import type { PyodideInterface } from "pyodide";
import { PythonEmitterOptions, reportDiagnostic } from "./lib.js";

export interface RunNodeEmitArgs {
  context: EmitContext<PythonEmitterOptions>;
  parsedYamlMap: Record<string, any>;
  commandArgs: Record<string, string>;
  resolvedOptions: PythonEmitterOptions;
  runPyodideGeneration: (
    pyodide: PyodideInterface,
    outputFolder: string,
    yamlFile: string,
    commandArgs: Record<string, string>,
  ) => Promise<void>;
}

export async function runNodeEmit({ context }: RunNodeEmitArgs): Promise<void> {
  reportDiagnostic(context.program, {
    code: "browser-runtime-load-failed",
    target: NoTarget,
    format: {
      details:
        " Native Python execution is not supported in the browser; the emitter must run in the in-browser Pyodide branch.",
    },
  });
}
