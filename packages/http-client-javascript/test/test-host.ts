import { Diagnostic, resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { HttpClientJavascriptEmitterTestLibrary } from "../src/testing/index.js";

export async function createSampleEmitterTestHost() {
  return createTestHost({
    libraries: [HttpClientJavascriptEmitterTestLibrary],
  });
}

export async function createHttpClientJavascriptEmitterTestRunner() {
  const host = await createSampleEmitterTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ["http-client-javascript"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createHttpClientJavascriptEmitterTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: "tsp-output",
  });
  const emitterOutputDir = "./tsp-output/http-client-javascript";
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
