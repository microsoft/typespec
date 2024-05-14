import {
  createDiagnosticCollector,
  Diagnostic,
  ModelProperty,
  Operation,
  Program,
} from "@typespec/compiler";
import { extractBodyAndMetadata } from "./body.js";
import { getOperationVerb } from "./decorators.js";
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
    extractBodyAndMetadata(program, operation.parameters, visibility, "request", {
      isImplicitPathParam,
    })
  );

  for (const item of metadata) {
    switch (item.kind) {
      case "path":
      case "query":
      case "header":
        parameters.push({
          ...item.options,
          param: item.property,
        });
        break;
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
