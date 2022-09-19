import {
  createDiagnosticCollector,
  Diagnostic,
  filterModelProperties,
  ModelProperty,
  Operation,
  Program,
} from "@cadl-lang/compiler";
import { createDiagnostic } from "../lib.js";
import { getAction, getCollectionAction, getResourceOperation } from "../rest.js";
import {
  getHeaderFieldName,
  getOperationVerb,
  getPathParamName,
  getQueryParamName,
  isBody,
} from "./decorators.js";
import { gatherMetadata, getRequestVisibility, isMetadata } from "./metadata.js";
import { HttpOperationParameters, HttpVerb } from "./types.js";

export function getOperationParameters(
  program: Program,
  operation: Operation,
  knownPathParamNames: string[] = []
): [HttpOperationParameters, readonly Diagnostic[]] {
  const verb = getExplicitVerbForOperation(program, operation);
  if (verb) {
    return getOperationParametersForVerb(program, operation, verb, knownPathParamNames);
  }

  // If no verb is explicitly specified, it is POST if there is a body and
  // GET otherwise. Theoretically, it is possible to use @visibility
  // strangely such that there is no body if the verb is POST and there is a
  // body if the verb is GET. In that rare case, GET is chosen arbitrarily.
  const post = getOperationParametersForVerb(program, operation, "post", knownPathParamNames);
  return post[0].bodyType
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
  const visibility = getRequestVisibility(verb);
  const metadata = gatherMetadata(
    program,
    diagnostics,
    operation.parameters,
    visibility,
    (_, param) => isMetadata(program, param) || isImplicitPathParam(param)
  );

  function isImplicitPathParam(param: ModelProperty) {
    return param.model === operation.parameters && knownPathParamNames.includes(param.name);
  }

  const result: HttpOperationParameters = {
    parameters: [],
    verb,
  };

  for (const param of metadata) {
    const queryParam = getQueryParamName(program, param);
    const pathParam =
      getPathParamName(program, param) ?? (isImplicitPathParam(param) && param.name);
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
        diagnostics.add(
          createDiagnostic({
            code: "optional-path-param",
            format: { paramName: param.name },
            target: operation,
          })
        );
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
    }
  }

  const unannotatedProperties = filterModelProperties(
    program,
    operation.parameters,
    (p) => !metadata.has(p)
  );

  if (unannotatedProperties.properties.size > 0) {
    if (result.bodyType === undefined) {
      result.bodyType = unannotatedProperties;
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

function getExplicitVerbForOperation(program: Program, operation: Operation): HttpVerb | undefined {
  const resourceOperation = getResourceOperation(program, operation);
  const verb =
    (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ??
    getOperationVerb(program, operation) ??
    // TODO: Enable this verb choice to be customized!
    (getAction(program, operation) || getCollectionAction(program, operation) ? "post" : undefined);

  return verb;
}

// TODO: Make this overridable by libraries
const resourceOperationToVerb: any = {
  read: "get",
  create: "post",
  createOrUpdate: "patch",
  createOrReplace: "put",
  update: "patch",
  delete: "delete",
  list: "get",
};
