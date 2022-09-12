import {
  createDiagnosticCollector,
  Diagnostic,
  filterModelProperties,
  Interface,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { createDiagnostic, createStateSymbol, reportDiagnostic } from "../lib.js";
import { getSegment, getSegmentSeparator, isAutoRoute } from "../rest.js";
import { extractParamsFromPath } from "../utils.js";
import {
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  getRoutePath,
  isBody,
} from "./decorators.js";
import { HttpOperationParameter, HttpOperationParameters, RouteOptions } from "./types.js";

// The set of allowed segment separator characters
const AllowedSegmentSeparators = ["/", ":"];

function normalizeFragment(fragment: string) {
  if (fragment.length > 0 && AllowedSegmentSeparators.indexOf(fragment[0]) < 0) {
    // Insert the default separator
    fragment = `/${fragment}`;
  }

  // Trim any trailing slash
  return fragment.replace(/\/$/g, "");
}

function buildPath(pathFragments: string[]) {
  // Join all fragments with leading and trailing slashes trimmed
  const path =
    pathFragments.length === 0
      ? "/"
      : pathFragments
          .map(normalizeFragment)
          .filter((x) => x !== "")
          .join("");

  // The final path must start with a '/'
  return path.length > 0 && path[0] === "/" ? path : `/${path}`;
}

function addSegmentFragment(program: Program, target: Type, pathFragments: string[]) {
  // Don't add the segment prefix if it is meant to be excluded
  // (empty string means exclude the segment)
  const segment = getSegment(program, target);
  const separator = getSegmentSeparator(program, target);
  if (segment && segment !== "") {
    pathFragments.push(`${separator ?? "/"}${segment}`);
  }
}

export function getOperationParameters(
  program: Program,
  operation: Operation
): [HttpOperationParameters, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const result: HttpOperationParameters = {
    parameters: [],
  };
  const unannotatedParams = new Set<ModelProperty>();

  for (const param of operation.parameters.properties.values()) {
    const queryParam = getQueryParamName(program, param);
    const pathParam = getPathParamName(program, param);
    const headerParam = getHeaderFieldName(program, param);
    const bodyParam = isBody(program, param);

    const defined = [
      ["query", queryParam],
      ["path", pathParam],
      ["header", headerParam],
      ["body", bodyParam],
    ].filter((x) => !!x[1]);
    if (defined.length >= 2) {
      diagnostics.add(
        createDiagnostic({
          code: "operation-param-duplicate-type",
          format: { paramName: param.name, types: defined.map((x) => x[0]).join(", ") },
          target: param,
        })
      );
    }

    if (queryParam) {
      result.parameters.push({ type: "query", name: queryParam, param });
    } else if (pathParam) {
      if (param.optional && param.default === undefined) {
        reportDiagnostic(program, {
          code: "optional-path-param",
          format: { paramName: param.name },
          target: operation,
        });
      }
      result.parameters.push({ type: "path", name: pathParam, param });
    } else if (headerParam) {
      result.parameters.push({ type: "header", name: headerParam, param });
    } else if (bodyParam) {
      if (result.bodyType === undefined) {
        result.bodyParameter = param;
        result.bodyType = param.type;
      } else {
        diagnostics.add(createDiagnostic({ code: "duplicate-body", target: param }));
      }
    } else {
      unannotatedParams.add(param);
    }
  }

  if (unannotatedParams.size > 0) {
    if (result.bodyType === undefined) {
      result.bodyType = filterModelProperties(program, operation.parameters, (p) =>
        unannotatedParams.has(p)
      );
    } else {
      diagnostics.add(
        createDiagnostic({
          code: "duplicate-body",
          messageId: "bodyAndUnannotated",
          target: operation,
        })
      );
    }
  }
  return diagnostics.wrap(result);
}

function generatePathFromParameters(
  program: Program,
  operation: Operation,
  pathFragments: string[],
  parameters: HttpOperationParameters,
  options: RouteOptions
) {
  const filteredParameters: HttpOperationParameter[] = [];
  for (const httpParam of parameters.parameters) {
    const { type, param } = httpParam;
    if (type === "path") {
      addSegmentFragment(program, param, pathFragments);

      const filteredParam = options.autoRouteOptions?.routeParamFilter?.(operation, param);
      if (filteredParam?.routeParamString) {
        pathFragments.push(`/${filteredParam.routeParamString}`);

        if (filteredParam?.excludeFromOperationParams === true) {
          // Skip the rest of the loop so that we don't add the parameter to the final list
          continue;
        }
      } else {
        // Add the path variable for the parameter
        if (param.type.kind === "String") {
          pathFragments.push(`/${param.type.value}`);
          continue; // Skip adding to the parameter list
        } else {
          pathFragments.push(`/{${param.name}}`);
        }
      }
    }

    // Push all usable parameters to the filtered list
    filteredParameters.push(httpParam);
  }

  // Replace the original parameters with filtered set
  parameters.parameters = filteredParameters;

  // Add the operation's own segment if present
  addSegmentFragment(program, operation, pathFragments);
}

export function resolvePathAndParameters(
  program: Program,
  operation: Operation,
  options: RouteOptions
): [{ path: string; parameters: HttpOperationParameters }, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const parameters = diagnostics.pipe(getOperationParameters(program, operation));
  let segments: string[] = [];
  if (isAutoRoute(program, operation)) {
    // The operation exists within an @autoRoute scope, generate the path.  This
    // mutates the pathFragments and parameters lists that are passed in!
    generatePathFromParameters(program, operation, segments, parameters, options);
  } else {
    segments = getRouteSegments(program, operation);

    // Pull out path parameters to verify what's in the path string
    const paramByName = new Map(
      parameters.parameters
        .filter(({ type }) => type === "path")
        .map(({ param }) => [param.name, param])
    );

    // Find path parameter names used in all route fragments
    const declaredPathParams = segments.flatMap(extractParamsFromPath);

    // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
    // delete it because it doesn't need to be added to the path.
    for (const declaredParam of declaredPathParams) {
      const param = paramByName.get(declaredParam);
      if (!param) {
        diagnostics.add(
          createDiagnostic({
            code: "missing-path-param",
            format: { param: declaredParam },
            target: operation,
          })
        );
        continue;
      }

      paramByName.delete(declaredParam);
    }

    // Add any remaining declared path params
    for (const param of paramByName.keys()) {
      segments.push(`{${param}}`);
    }
  }

  return diagnostics.wrap({
    path: buildPath(segments),
    parameters,
  });
}

function getRouteSegments(program: Program, target: Operation | Interface | Namespace): string[] {
  const route = getRoutePath(program, target)?.path;
  const seg = route ? [route] : [];
  switch (target.kind) {
    case "Namespace":
      return target.namespace ? [...getRouteSegments(program, target.namespace), ...seg] : seg;
    case "Interface":
      return target.namespace ? [...getRouteSegments(program, target.namespace), ...seg] : seg;

    case "Operation":
      return target.interface
        ? [...getRouteSegments(program, target.interface), ...seg]
        : target.namespace
        ? [...getRouteSegments(program, target.namespace), ...seg]
        : seg;
  }
}

const externalInterfaces = createStateSymbol("externalInterfaces");
/**
 * @depreacted DO NOT USE. For internal use only as a workaround.
 * @param program Program
 * @param target Target namespace
 * @param sourceInterface Interface that should be included in namespace.
 */
export function includeInterfaceRoutesInNamespace(
  program: Program,
  target: Namespace,
  sourceInterface: string
) {
  let array = program.stateMap(externalInterfaces).get(target);
  if (array === undefined) {
    array = [];
    program.stateMap(externalInterfaces).set(target, array);
  }

  array.push(sourceInterface);
}
