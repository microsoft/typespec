import {
  createDiagnosticCollector,
  Diagnostic,
  ModelProperty,
  Operation,
  Program,
} from "@typespec/compiler";
import { extractBodyAndMetadata } from "./body.js";
import {
  getHeaderFieldOptions,
  getOperationVerb,
  getPathParamOptions,
  getQueryParamOptions,
  isBody,
  isBodyRoot,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { resolveRequestVisibility } from "./metadata.js";
import {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpVerb,
  OperationParameterOptions,
} from "./types.js";

export function getOperationParameters(
  program: Program,
  operation: Operation,
  overloadBase?: HttpOperation,
  knownPathParamNames: string[] = [],
  options: OperationParameterOptions = {}
): [HttpOperationParameters, readonly Diagnostic[]] {
  const verb =
    (options?.verbSelector && options.verbSelector(program, operation)) ??
    getOperationVerb(program, operation) ??
    overloadBase?.verb;

  if (verb) {
    return getOperationParametersForVerb(program, operation, verb, knownPathParamNames);
  }

  // If no verb is explicitly specified, it is POST if there is a body and
  // GET otherwise. Theoretically, it is possible to use @visibility
  // strangely such that there is no body if the verb is POST and there is a
  // body if the verb is GET. In that rare case, GET is chosen arbitrarily.
  const post = getOperationParametersForVerb(program, operation, "post", knownPathParamNames);
  return post[0].body
    ? post
    : getOperationParametersForVerb(program, operation, "get", knownPathParamNames);
}

function getOperationParametersForVerb(
  program: Program,
  operation: Operation,
  verb: HttpVerb,
  knownPathParamNames: string[]
): [HttpOperationParameters, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const visibility = resolveRequestVisibility(program, operation, verb);
  function isImplicitPathParam(param: ModelProperty) {
    const isTopLevel = param.model === operation.parameters;
    return isTopLevel && knownPathParamNames.includes(param.name);
  }

  const parameters: HttpOperationParameter[] = [];
  const { body: resolvedBody, metadata } = diagnostics.pipe(
    extractBodyAndMetadata(program, operation.parameters, visibility, "request")
  );

  for (const param of metadata) {
    const queryOptions = getQueryParamOptions(program, param);
    const pathOptions =
      getPathParamOptions(program, param) ??
      (isImplicitPathParam(param) && { type: "path", name: param.name });
    const headerOptions = getHeaderFieldOptions(program, param);
    const isBodyVal = isBody(program, param);
    const isBodyRootVal = isBodyRoot(program, param);
    const defined = [
      ["query", queryOptions],
      ["path", pathOptions],
      ["header", headerOptions],
      ["body", isBodyVal || isBodyRootVal],
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

    if (queryOptions) {
      parameters.push({
        ...queryOptions,
        param,
      });
    } else if (pathOptions) {
      if (param.optional) {
        diagnostics.add(
          createDiagnostic({
            code: "optional-path-param",
            format: { paramName: param.name },
            target: operation,
          })
        );
      }
      parameters.push({
        ...pathOptions,
        param,
      });
    } else if (headerOptions) {
      parameters.push({
        ...headerOptions,
        param,
      });
    }
  }

  const body = resolvedBody;

  return diagnostics.wrap({
    parameters,
    verb,
    body,
    get bodyType() {
      return body?.type;
    },
    get bodyParameter() {
      return body?.property;
    },
  });
}
