import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { HttpVerb } from "../src/http.js";
import { getAllRoutes } from "../src/route.js";

export { TestHost } from "@cadl-lang/compiler/dist/test/test-host.js";

export async function createRestTestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../");

  // load rest
  await host.addRealCadlFile("./node_modules/rest/package.json", resolve(root, "../package.json"));
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolve(root, "../lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolve(root, "../lib/resource.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/http.cadl",
    resolve(root, "../lib/http.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/rest.js",
    resolve(root, "../dist/src/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/route.js",
    resolve(root, "../dist/src/route.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/resource.js",
    resolve(root, "../dist/src/resource.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/http.js",
    resolve(root, "../dist/src/http.js")
  );

  return host;
}

export interface RouteDetails {
  path: string;
  verb: HttpVerb;
  params: string[];
}

export async function getRoutesFor(code: string): Promise<RouteDetails[]> {
  const host = await createRestTestHost();
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; namespace TestNamespace; using Cadl.Rest; using Cadl.Http; ${code}`
  );

  await host.compile("./main.cadl", { noEmit: true });
  const routes = getAllRoutes(host.program);
  return routes.map((r) => {
    return {
      verb: r.verb,
      path: r.path,
      params: r.parameters.parameters
        .map(({ type, name }) => (type === "path" ? name : undefined))
        .filter((p) => p !== undefined) as string[],
    };
  });
}
