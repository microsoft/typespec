import { createDiagnosticCollector, Diagnostic, Program, resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import {
  getAllHttpServices,
  HttpOperation,
  HttpOperationParameter,
  HttpVerb,
} from "../src/index.js";
import { RouteResolutionOptions } from "../src/types.js";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http"],
})
  .importLibraries()
  .using("Http");

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
          (r.parameters.body?.type?.kind === "Model"
            ? Array.from(r.parameters.body.type.properties.keys())
            : undefined),
      },
    };
  });

  return [details, diagnostics];
}

export interface CompileOperationsResult {
  program: Program;
  operations: HttpOperation[];
  diagnostics: readonly Diagnostic[];
}

export async function compileOperationsFull(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<CompileOperationsResult> {
  const diagnostics = createDiagnosticCollector();
  const { program } = diagnostics.pipe(
    await Tester.compileAndDiagnose(
      `@service(#{title: "Test Service"}) namespace TestService;
    ${code}`,
    ),
  );
  const services = diagnostics.pipe(getAllHttpServices(program, routeOptions));
  return { operations: services[0].operations, diagnostics: diagnostics.diagnostics, program };
}

export async function diagnoseOperations(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<readonly Diagnostic[]> {
  const [_, diagnostics] = await compileOperations(code, routeOptions);
  return diagnostics;
}

export async function getOperationsWithServiceNamespace(
  code: string,
  routeOptions?: RouteResolutionOptions,
): Promise<[HttpOperation[], readonly Diagnostic[]]> {
  const [{ program }, _] = await Tester.compileAndDiagnose(
    `@service(#{title: "Test Service"}) namespace TestService;
    ${code}`,
  );
  const [services] = getAllHttpServices(program, routeOptions);
  return [services[0].operations, program.diagnostics];
}

export async function getOperations(code: string): Promise<HttpOperation[]> {
  const { program } = await Tester.compile(code);
  const [services, diagnostics] = getAllHttpServices(program);

  expectDiagnosticEmpty(diagnostics);
  return services[0].operations;
}
