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
  PathParameterOptions,
  QueryParameterOptions,
} from "./types.js";
import { parseUriTemplate } from "./uri-template.js";

export function getOperationParameters(
  program: Program,
  operation: Operation,
  partialUriTemplate: string,
  overloadBase?: HttpOperation,
  options: OperationParameterOptions = {}
): [HttpOperationParameters, readonly Diagnostic[]] {
  const verb =
    (options?.verbSelector && options.verbSelector(program, operation)) ??
    getOperationVerb(program, operation) ??
    overloadBase?.verb;

  if (verb) {
    return getOperationParametersForVerb(program, operation, verb, partialUriTemplate);
  }

  // If no verb is explicitly specified, it is POST if there is a body and
  // GET otherwise. Theoretically, it is possible to use @visibility
  // strangely such that there is no body if the verb is POST and there is a
  // body if the verb is GET. In that rare case, GET is chosen arbitrarily.
  const post = getOperationParametersForVerb(program, operation, "post", partialUriTemplate);
  return post[0].body
    ? post
    : getOperationParametersForVerb(program, operation, "get", partialUriTemplate);
}

const operatorToStyle = {
  ";": "matrix",
  "#": "fragment",
  ".": "label",
  "/": "path",
} as const;

function getOperationParametersForVerb(
  program: Program,
  operation: Operation,
  verb: HttpVerb,
  partialUriTemplate: string
): [HttpOperationParameters, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const visibility = resolveRequestVisibility(program, operation, verb);
  const parsedUriTemplate = parseUriTemplate(partialUriTemplate);

  const parameters: HttpOperationParameter[] = [];
  const { body: resolvedBody, metadata } = diagnostics.pipe(
    resolveHttpPayload(program, operation.parameters, visibility, "request", {
      implicitParameter: (
        param: ModelProperty
      ): QueryParameterOptions | PathParameterOptions | undefined => {
        const isTopLevel = param.model === operation.parameters;
        const uriParam =
          isTopLevel && parsedUriTemplate.parameters.find((x) => x.name === param.name);

        if (!uriParam) {
          return undefined;
        }

        const explode = uriParam.modifier?.type === "explode";
        if (uriParam.operator === "?" || uriParam.operator === "&") {
          return {
            type: "query",
            name: uriParam.name,
            explode,
          };
        } else if (uriParam.operator === "+") {
          return {
            type: "path",
            name: uriParam.name,
            explode,
            allowReserved: true,
            style: "simple",
          };
        } else {
          return {
            type: "path",
            name: uriParam.name,
            explode,
            allowReserved: false,
            style: (uriParam.operator && operatorToStyle[uriParam.operator]) ?? "simple",
          };
        }
      },
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
    properties: metadata,
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
