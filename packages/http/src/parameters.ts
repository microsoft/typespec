import {
  createDiagnosticCollector,
  Diagnostic,
  filterModelProperties,
  ModelProperty,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import { validateBodyProperty } from "./body.js";
import { getContentTypes, isContentTypeHeader } from "./content-types.js";
import {
  getHeaderFieldOptions,
  getOperationVerb,
  getPathParamOptions,
  getQueryParamOptions,
  isBody,
  isBodyRoot,
} from "./decorators.js";
import { createDiagnostic } from "./lib.js";
import { gatherMetadata, isMetadata, isVisible, resolveRequestVisibility } from "./metadata.js";
import {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationRequestBody,
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
  const rootPropertyMap = new Map<ModelProperty, ModelProperty>();
  const metadata = gatherMetadata(
    program,
    diagnostics,
    operation.parameters,
    visibility,
    (_, param) => isMetadata(program, param) || isImplicitPathParam(param),
    rootPropertyMap
  );

  function isImplicitPathParam(param: ModelProperty) {
    const isTopLevel = param.model === operation.parameters;
    return isTopLevel && knownPathParamNames.includes(param.name);
  }

  const parameters: HttpOperationParameter[] = [];
  let resolvedBody: ResolvedRequestBody | undefined;
  let contentTypes: string[] | undefined;

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
      if (isContentTypeHeader(program, param)) {
        contentTypes = diagnostics.pipe(getContentTypes(param));
      }
      parameters.push({
        ...headerOptions,
        param,
      });
    } else if (isBodyVal || isBodyRootVal) {
      if (resolvedBody === undefined) {
        if (isBodyVal) {
          diagnostics.pipe(validateBodyProperty(program, param));
        }
        resolvedBody = { parameter: param, type: param.type, isExplicit: isBodyVal };
      } else {
        diagnostics.add(createDiagnostic({ code: "duplicate-body", target: param }));
      }
    }
  }

  const bodyRoot = resolvedBody?.parameter
    ? rootPropertyMap.get(resolvedBody.parameter)
    : undefined;
  const unannotatedProperties = filterModelProperties(
    program,
    operation.parameters,
    (p) => !metadata.has(p) && p !== bodyRoot && isVisible(program, p, visibility)
  );

  if (unannotatedProperties.properties.size > 0) {
    if (resolvedBody === undefined) {
      resolvedBody = { type: unannotatedProperties, isExplicit: false };
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
  const body = diagnostics.pipe(computeHttpOperationBody(operation, resolvedBody, contentTypes));

  return diagnostics.wrap({
    parameters,
    verb,
    body,
    get bodyType() {
      return body?.type;
    },
    get bodyParameter() {
      return body?.parameter;
    },
  });
}

interface ResolvedRequestBody {
  readonly type: Type;
  readonly isExplicit: boolean;
  readonly parameter?: ModelProperty;
}

function computeHttpOperationBody(
  operation: Operation,
  resolvedBody: ResolvedRequestBody | undefined,
  contentTypes: string[] | undefined
): [HttpOperationRequestBody | undefined, readonly Diagnostic[]] {
  contentTypes ??= [];
  const diagnostics: Diagnostic[] = [];
  if (resolvedBody === undefined) {
    if (contentTypes.length > 0) {
      diagnostics.push(
        createDiagnostic({
          code: "content-type-ignored",
          target: operation.parameters,
        })
      );
    }
    return [undefined, diagnostics];
  }

  if (contentTypes.includes("multipart/form-data") && resolvedBody.type.kind !== "Model") {
    diagnostics.push(
      createDiagnostic({
        code: "multipart-model",
        target: resolvedBody.parameter ?? operation.parameters,
      })
    );
    return [undefined, diagnostics];
  }

  const body: HttpOperationRequestBody = {
    ...resolvedBody,
    contentTypes,
  };
  return [body, diagnostics];
}
