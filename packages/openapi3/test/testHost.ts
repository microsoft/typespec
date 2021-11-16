import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

export async function createOpenAPITestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  // load rest
  await host.addRealCadlFile(
    "./node_modules/rest/package.json",
    resolve(root, "../rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolve(root, "../rest/lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolve(root, "../rest/lib/resource.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/http.cadl",
    resolve(root, "../rest/lib/http.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/rest.js",
    resolve(root, "../rest/dist/src/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/resource.js",
    resolve(root, "../rest/dist/src/resource.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/route.js",
    resolve(root, "../rest/dist/src/route.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/http.js",
    resolve(root, "../rest/dist/src/http.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/openapi3/package.json",
    resolve(root, "../openapi3/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/openapi3/dist/src/openapi.js",
    resolve(root, "../openapi3/dist/src/openapi.js")
  );

  return host;
}

export async function openApiFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolve("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "openapi3";using Cadl.Rest;using Cadl.Http;${code}`
  );
  await host.compile("./main.cadl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
