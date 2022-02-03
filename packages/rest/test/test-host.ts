import { Diagnostic } from "@cadl-lang/compiler";
import { createTestHost, expectDiagnosticEmpty, TestHost } from "@cadl-lang/compiler/testing";
import { HttpVerb } from "../src/http.js";
import { getAllRoutes, HttpOperationParameter } from "../src/route.js";
import { RestTestLibrary } from "../src/testing/index.js";

export async function createRestTestHost(): Promise<TestHost> {
  return createTestHost({
    libraries: [RestTestLibrary],
  });
}

export interface RouteDetails {
  path: string;
  verb: HttpVerb;
  params: string[];
}

export async function getRoutesFor(code: string): Promise<RouteDetails[]> {
  const [routes, diagnostics] = await compileOperations(code);
  expectDiagnosticEmpty(diagnostics);
  return routes.map((route) => ({
    ...route,
    params: route.params.params
      .map(({ type, name }) => (type === "path" ? name : undefined))
      .filter((p) => p !== undefined) as string[],
  }));
}

export interface OperationDetails {
  verb: HttpVerb;
  path: string;
  params: {
    params: Array<{ name: string; type: HttpOperationParameter["type"] }>;
    body?: string;
  };
}

export async function compileOperations(
  code: string
): Promise<[OperationDetails[], readonly Diagnostic[]]> {
  const host = await createRestTestHost();
  host.addCadlFile(
    "./main.cadl",
    `import "@cadl-lang/rest"; namespace TestNamespace; using Cadl.Rest; using Cadl.Http; ${code}`
  );

  await host.compileAndDiagnose("./main.cadl", { noEmit: true });
  const routes = getAllRoutes(host.program);
  const details = routes.map((r) => {
    return {
      verb: r.verb,
      path: r.path,
      params: {
        params: r.parameters.parameters.map(({ type, name }) => ({ type, name })),
        body: r.parameters.body?.name,
      },
    };
  });

  return [details, host.program.diagnostics];
}
