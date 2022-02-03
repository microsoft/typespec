import { createTestHost, expectDiagnosticEmpty } from "@cadl-lang/compiler/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { OpenAPITestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, OpenAPITestLibrary],
  });
}

export async function compileAndDiagnose(code: string) {
  const host = await createOpenAPITestHost();
  host.addCadlFile(
    "./main.cadl",
    `import "@cadl-lang/rest"; import "@cadl-lang/openapi";using Cadl.Rest;using Cadl.Http;${code}`
  );
  return await host.compileAndDiagnose("./main.cadl");
}

export async function compile(code: string) {
  const [result, diagnostics] = await compileAndDiagnose(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
