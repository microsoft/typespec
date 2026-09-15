import type { Diagnostic, Program } from "@typespec/compiler";
import { dirname, resolve } from "path";

export async function compileScenario(
  compiler: typeof import("@typespec/compiler"),
  specFilePath: string,
  additionalImports: string[] = [],
): Promise<[Program | undefined, readonly Diagnostic[]]> {
  const entrypoint = resolve(specFilePath);
  const [options, diagnostics] = await compiler.resolveCompilerOptions(compiler.NodeHost, {
    entrypoint,
    cwd: dirname(entrypoint),
    env: process.env,
  });
  if (diagnostics.length > 0) {
    return [undefined, diagnostics];
  }

  const program = await compiler.compile(compiler.NodeHost, entrypoint, {
    ...options,
    additionalImports: [...(options.additionalImports ?? []), ...additionalImports],
    noEmit: true,
    warningAsError: true,
    // noEmit alone still loads configured emitters.
    emit: [],
  });
  return [program, program.diagnostics];
}
