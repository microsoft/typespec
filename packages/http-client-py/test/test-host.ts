import { Diagnostic, resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";

const ApiTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/http-client-py"],
});

export const Tester = ApiTester.import("@typespec/http", "@typespec/rest")
  .using("Http", "Rest")
  .emit("@typespec/http-client-py");

export async function emitWithDiagnostics(
  code: string,
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const [result, diagnostics] = await Tester.compileAndDiagnose(code);
  return [result.outputs, diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
