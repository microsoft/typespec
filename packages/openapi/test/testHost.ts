import { formatDiagnostic, resolvePath } from "@cadl-lang/compiler";
import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { fileURLToPath } from "url";

export async function createOpenAPITestHost() {
  const host = await createTestHost();
  const root = resolvePath(fileURLToPath(import.meta.url), "../../../");

  // load rest
  await host.addRealCadlFile(
    "./node_modules/rest/package.json",
    resolvePath(root, "../rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolvePath(root, "../rest/lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolvePath(root, "../rest/lib/resource.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/http.cadl",
    resolvePath(root, "../rest/lib/http.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/rest.js",
    resolvePath(root, "../rest/dist/src/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/resource.js",
    resolvePath(root, "../rest/dist/src/resource.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/route.js",
    resolvePath(root, "../rest/dist/src/route.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/http.js",
    resolvePath(root, "../rest/dist/src/http.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/openapi/package.json",
    resolvePath(root, "../openapi/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/openapi/dist/src/index.js",
    resolvePath(root, "../openapi/dist/src/index.js")
  );

  return host;
}

export async function compileAndDiagnose(code: string) {
  const host = await createOpenAPITestHost();
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "openapi";using Cadl.Rest;using Cadl.Http;${code}`
  );
  return await host.compileAndDiagnose("./main.cadl");
}

export async function compile(code: string) {
  const [result, diagnostics] = await compileAndDiagnose(code);
  if (diagnostics.length > 0) {
    let message = "Unexpected diagnostics:\n" + diagnostics.map(formatDiagnostic).join("\n");
    throw new Error(message);
  }
  return result;
}
