import { Diagnostic } from "@typespec/compiler";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  TestHost,
} from "@typespec/compiler/testing";
import {
  getAllHttpServices,
  HttpOperation,
  HttpOperationParameter,
  HttpVerb,
  RouteResolutionOptions,
} from "@typespec/http";
import { HttpTestLibrary } from "@typespec/http/testing";
import { RestTestLibrary } from "../src/testing/index.js";

export async function createRestTestHost(): Promise<TestHost> {
  return createTestHost({
    libraries: [HttpTestLibrary, RestTestLibrary],
  });
}
export async function createRestTestRunner(): Promise<BasicTestRunner> {
  const host = await createRestTestHost();
  return createTestWrapper(host, { autoUsings: ["TypeSpec.Http", "TypeSpec.Rest"] });
}

export interface RouteDetails {
  path: string;
  verb: HttpVerb;
  params: string[];
}

export async function getRoutesFor(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<RouteDetails[]> {
  const [routes, diagnostics] = await compileOperations(code, routeOptions);
  expectDiagnosticEmpty(diagnostics);
  return routes.map((route) => ({
    ...route,
    params: route.params.params
      .map(({ type, name }) => (type === "path" ? name : undefined))
      .filter((p) => p !== undefined) as string[],
  }));
}

export interface SimpleOperationDetails {
  verb: HttpVerb;
  path: string;
  params: {
    params: Array<{ name: string; type: HttpOperationParameter["type"] }>;
    /**
     * name of explicit `@body` parameter or array of unannotated parameter names that make up the body.
     */
    body?: string | string[];
  };
}

export async function compileOperations(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<[SimpleOperationDetails[], readonly Diagnostic[]]> {
  const [routes, diagnostics] = await getOperationsWithServiceNamespace(code, routeOptions);

  const details = routes.map((r) => {
    return {
      verb: r.verb,
      path: r.path,
      params: {
        params: r.parameters.parameters.map(({ type, name }) => ({ type, name })),
        body:
          r.parameters.body?.property?.name ??
          (r.parameters.body?.type.kind === "Model"
            ? Array.from(r.parameters.body?.type.properties.keys())
            : undefined),
      },
    };
  });

  return [details, diagnostics];
}

export async function getOperationsWithServiceNamespace(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<[HttpOperation[], readonly Diagnostic[]]> {
  const runner = await createRestTestRunner();
  await runner.compileAndDiagnose(
    `@service({title: "Test Service"}) namespace TestService;
    ${code}`,
    {
      noEmit: true,
    },
  );
  const [services] = getAllHttpServices(runner.program, routeOptions);
  return [services[0].operations, runner.program.diagnostics];
}

export async function getOperations(code: string): Promise<HttpOperation[]> {
  const runner = await createRestTestRunner();
  await runner.compile(code);
  const [services, diagnostics] = getAllHttpServices(runner.program);

  expectDiagnosticEmpty(diagnostics);
  return services[0].operations;
}
