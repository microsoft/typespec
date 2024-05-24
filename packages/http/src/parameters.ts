import {
  createDiagnosticCollector,
  Diagnostic,
  ModelProperty,
  Operation,
  Program,
} from "@typespec/compiler";
import { getOperationVerb } from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { resolveRequestVisibility } from "./metadata.js";
import { resolveHttpPayload } from "./payload.js";
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
    resolveHttpPayload(program, operation.parameters, visibility, "request", {
      isImplicitPathParam,
    })
  );

  for (const item of metadata) {
    switch (item.kind) {
      case "contentType":
        parameters.push({
          name: "Content-Type",
          type: "header",
          param: item.property,
        });
        break;
      case "path":
        if (item.property.optional) {
          diagnostics.add(
            createDiagnostic({
              code: "optional-path-param",
              format: { paramName: item.property.name },
              target: item.property,
            })
          );
        }
      // eslint-disable-next-line no-fallthrough
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
