import type { Diagnostic } from "@typespec/compiler";
import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import {
  getAllHttpServices,
  HttpOperation,
  HttpOperationParameter,
  HttpVerb,
} from "@typespec/http";
import { unsafe_RouteResolutionOptions as RouteResolutionOptions } from "@typespec/http/experimental";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest"],
})
  .importLibraries()
  .using("Http", "Rest");

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
  const [result, diagnostics] = await Tester.compileAndDiagnose(
    `@service(#{title: "Test Service"}) namespace TestService;
    ${code}`,
  );
  const [services] = getAllHttpServices(result.program, routeOptions);
  return [services[0].operations, diagnostics];
}

export async function getOperations(code: string): Promise<HttpOperation[]> {
  const { program } = await Tester.compile(code);
  const [services, diagnostics] = getAllHttpServices(program);

  expectDiagnosticEmpty(diagnostics);
  return services[0].operations;
}
