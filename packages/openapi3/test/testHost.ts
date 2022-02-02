import { resolvePath } from "@cadl-lang/compiler";
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

  // Load openapi3
  await host.addRealCadlFile(
    "./node_modules/openapi3/package.json",
    resolvePath(root, "../openapi3/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/openapi3/dist/src/openapi.js",
    resolvePath(root, "../openapi3/dist/src/openapi.js")
  );

  // load versioning
  await host.addRealCadlFile(
    "./node_modules/versioning/package.json",
    resolvePath(root, "../versioning/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/versioning/lib/versioning.cadl",
    resolvePath(root, "../versioning/lib/versioning.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/versioning/dist/src/versioning.js",
    resolvePath(root, "../versioning/dist/src/versioning.js")
  );

  return host;
}

function versionedOutput(path: string, version: string) {
  return path.replace(".json", "." + version + ".json");
}
export async function openApiFor(code: string, versions?: string[]) {
  const host = await createOpenAPITestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "openapi"; import "openapi3"; ${
      versions ? `import "versioning"; ` : ""
    }using Cadl.Rest;using Cadl.Http;${code}`
  );
  await host.compile("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    emitters: ["openapi3"],
  });

  if (!versions) {
    return JSON.parse(host.fs.get(outPath)!);
  } else {
    const output: any = {};
    for (const version of versions) {
      output[version] = JSON.parse(host.fs.get(versionedOutput(outPath, version))!);
    }
    return output;
  }
}

export async function checkFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "openapi"; import "openapi3"; using Cadl.Rest; using Cadl.Http;${code}`
  );
  const result = await host.diagnose("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    emitters: ["openapi3"],
  });
  return result;
}
