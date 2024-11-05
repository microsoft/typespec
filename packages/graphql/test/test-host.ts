import type { Diagnostic } from "@typespec/compiler";
import { resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { GraphqlTestLibrary } from "../src/testing/index.js";

export async function createGraphqlTestHost() {
  return createTestHost({
    libraries: [GraphqlTestLibrary],
  });
}

export async function createGraphqlTestRunner() {
  const host = await createGraphqlTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ["graphql"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string,
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createGraphqlTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: "tsp-output",
  });
  const emitterOutputDir = "./tsp-output/graphql";
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    result[file] = (await runner.program.host.readFile(resolvePath(emitterOutputDir, file))).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
