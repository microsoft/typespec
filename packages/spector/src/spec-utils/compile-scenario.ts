import type { CompilerOptions, Diagnostic, Program } from "@typespec/compiler";

export async function compileScenario(
  compiler: typeof import("@typespec/compiler"),
  specFilePath: string,
  options: CompilerOptions = {},
): Promise<[Program, readonly Diagnostic[]]> {
  const [configOptions, configDiagnostics] = await compiler.resolveCompilerOptions(
    compiler.NodeHost,
    { entrypoint: specFilePath, cwd: process.cwd(), env: process.env },
  );
  const program = await compiler.compile(compiler.NodeHost, specFilePath, {
    ...configOptions,
    ...options,
    // Preserve Spector's imports and validation behavior independently of emitter configuration.
    additionalImports: options.additionalImports,
    emit: [],
    linterRuleSet: options.linterRuleSet,
    noEmit: true,
    warningAsError: true,
  });
  return [program, [...configDiagnostics, ...program.diagnostics]];
}
