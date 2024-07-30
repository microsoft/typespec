import { Diagnostic, Program, resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { TestLibrary } from "../src/testing/index.js";

export async function createTypespecCliTestHost(
  options: { libraries: "Http"[] } = { libraries: [] }
) {
  const libraries = [TestLibrary];
  if (options.libraries.includes("Http")) {
    libraries.push(HttpTestLibrary);
  }
  return createTestHost({
    libraries,
  });
}

export async function createTypespecCliTestRunner() {
  const host = await createTypespecCliTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ["@typespec/efnext"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createTypespecCliTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: "tsp-output",
  });
  const emitterOutputDir = "./tsp-output/@typespec/efnext";
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

export async function getProgram(
  code: string,
  options: { libraries: "Http"[] } = { libraries: [] }
): Promise<Program> {
  const host = await createTypespecCliTestHost(options);
  const wrapper = createTestWrapper(host, {
    compilerOptions: {
      noEmit: true,
    },
  });
  const [_, diagnostics] = await wrapper.compileAndDiagnose(code);
  expectDiagnosticEmpty(diagnostics);
  return wrapper.program;
}
