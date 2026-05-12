import {
  Diagnostic,
  ModelProperty,
  Operation,
  Type,
  Union,
  compilerAssert,
  createDiagnosticCollector,
  getEncode,
  getSummary,
  isErrorModel,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  HttpOperation,
  HttpOperationHeaderParameter,
  HttpOperationParameter,
  HttpOperationPathParameter,
  HttpOperationQueryParameter,
  Visibility,
  getCookieParamOptions,
  getHeaderFieldName,
  getHeaderFieldOptions,
  getPathParamName,
  getQueryParamName,
  getQueryParamOptions,
  isBody,
  isCookieParam,
  isHeader,
  isPathParam,
  isQueryParam,
} from "@typespec/http";
import { StreamMetadata, getStreamMetadata } from "@typespec/http/experimental";
import { camelCase } from "change-case";
import { getResponseAsBool, isInScope, shouldOmitSlashFromEmptyRoute } from "./decorators.js";
import {
  CollectionFormat,
  SdkBodyParameter,
  SdkClientType,
  SdkCookieParameter,
  SdkHeaderParameter,
  SdkHttpErrorResponse,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkHttpResponse,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkModelType,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceResponseHeader,
  SdkStreamMetadata,
  SdkType,
  SerializationOptions,
  TCGCContext,
} from "./interfaces.js";
import {
  compareModelProperties,
  getActualClientType,
  getAvailableApiVersions,
  getClientDoc,
  getCorrespondingClientParam,
  getHttpBodyType,
  getHttpOperationResponseHeaders,
  getStreamAsBytes,
  getTypeDecorators,
  isAcceptHeader,
  isContentTypeHeader,
  isHttpBodySpread,
  isNeverOrVoidType,
  isSubscriptionId,
} from "./internal-utils.js";
import { createDiagnostic } from "./lib.js";
import { isMediaTypeJson, isMediaTypeTextPlain, isMediaTypeXml } from "./media-types.js";
import {
  getCrossLanguageDefinitionId,
  getEffectivePayloadType,
  getWireName,
  isApiVersion,
} from "./public-utils.js";
import {
  addEncodeInfo,
  getClientType,
  getClientTypeWithDiagnostics,
  getSdkConstant,
  getSdkModelPropertyTypeBase,
  getTypeSpecBuiltInType,
  isReadOnly,
} from "./types.js";

/**
 * Build serialization options from content types.
 * This provides a consistent way for emitters to determine the serialization format
 * for body parameters and HTTP responses, regardless of whether the type is a model or basic type.
 * @param contentTypes - The content types to build serialization options from.
 * @param name - The serialized name of the body parameter (for request bodies).
 */
function buildSerializationOptionsFromContentTypes(
  contentTypes: string[],
  name?: string,
): SerializationOptions {
  const options: SerializationOptions = {};
  if (contentTypes.some(isMediaTypeJson)) {
    options.json = { name: name ?? "" };
  }
  if (contentTypes.some(isMediaTypeXml)) {
    options.xml = { name: name ?? "" };
  }
  return options;
}

function buildSdkStreamMetadata(
  context: TCGCContext,
  tspStreamMetadata: StreamMetadata,
  operation: Operation,
): [SdkStreamMetadata, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const bodyType = diagnostics.pipe(
    getClientTypeWithDiagnostics(context, tspStreamMetadata.bodyType, operation),
  );
  const originalType = diagnostics.pipe(
    getClientTypeWithDiagnostics(context, tspStreamMetadata.originalType, operation),
  );
  const streamType = diagnostics.pipe(
    getClientTypeWithDiagnostics(context, tspStreamMetadata.streamType, operation),
  );
  return diagnostics.wrap({
    bodyType,
    originalType,
    streamType,
    contentTypes: [...tspStreamMetadata.contentTypes],
  });
}

export function getSdkHttpOperation(
  context: TCGCContext,
  httpOperation: HttpOperation,
  methodParameters: SdkMethodParameter[],
  client: SdkClientType<SdkHttpOperation>,
): [SdkHttpOperation, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const { responses, exceptions } = diagnostics.pipe(
    getSdkHttpResponseAndExceptions(context, httpOperation, client),
  );
  if (getResponseAsBool(context, httpOperation.operation)) {
    // HEAD operations never have a response body, so we clear response.type here.
    // The boolean return type is a client-side concept handled at the method response level.
    for (const response of responses) {
      response.type = undefined;
    }
    // Promote 404 from exception to valid response.
    const fourOFourResponse = exceptions.find((e) => e.statusCodes === 404);
    if (fourOFourResponse) {
      // move from exception to valid response with status code 404
      responses.push({
        ...fourOFourResponse,
        type: undefined,
        statusCodes: 404,
      });
      exceptions.splice(exceptions.indexOf(fourOFourResponse), 1);
    } else {
      // add 404 response to the list of valid responses
      responses.push({
        kind: "http",
        statusCodes: 404,
        apiVersions: getAvailableApiVersions(
          context,
          httpOperation.operation,
          getActualClientType(client.__raw),
        ),
        headers: [],
        __raw: (responses[0] || exceptions[0]).__raw,
        serializationOptions: {},
      });
    }
  }
  const successResponsesWithBodies = responses.filter((r) => r.type);
  const parameters = diagnostics.pipe(
    getSdkHttpParameters(context, httpOperation, methodParameters, successResponsesWithBodies[0]),
  );
  filterOutUselessPathParameters(context, httpOperation, methodParameters);
  filterOutReadOnlyParameters(methodParameters);

  // Check if empty route should be treated as empty string
  let path = httpOperation.path;
  if (path === "/" && shouldOmitSlashFromEmptyRoute(context, httpOperation.operation)) {
    path = "";
  }

  return diagnostics.wrap({
    __raw: httpOperation,
    kind: "http",
    path,
    uriTemplate: httpOperation.uriTemplate,
    verb: httpOperation.verb,
    ...parameters,
    responses,
    exceptions,
  });
}

export function isSdkHttpParameter(context: TCGCContext, type: ModelProperty): boolean {
  const program = context.program;
  return (
    isPathParam(program, type) ||
    isQueryParam(program, type) ||
    isHeader(program, type) ||
    isBody(program, type) ||
    isCookieParam(program, type)
  );
}

interface SdkHttpParameters {
  parameters: (SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkCookieParameter)[];
  bodyParam?: SdkBodyParameter;
}

function getSdkHttpParameters(
  context: TCGCContext,
  httpOperation: HttpOperation,
  methodParameters: SdkMethodParameter[],
  responseBody?: SdkHttpResponse | SdkHttpErrorResponse,
): [SdkHttpParameters, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const retval: SdkHttpParameters = {
    parameters: [],
    bodyParam: undefined,
  };

  const methodParametersMap = new Map<ModelProperty, SdkMethodParameter>();
  methodParameters.map((mp) => {
    if (mp.__raw) {
      methodParametersMap.set(mp.__raw, mp);
    }
  });

  // Filter parameters by type and scope, warning if required parameters are scoped out
  const filteredParams: HttpOperationParameter[] = [];
  for (const x of httpOperation.parameters.parameters) {
    if (isNeverOrVoidType(x.param.type)) {
      continue;
    }
    if (!isInScope(context, x.param)) {
      // Warn if a required parameter is being scoped out
      if (!x.param.optional) {
        diagnostics.add(
          createDiagnostic({
            code: "required-parameter-scoped-out",
            target: x.param,
            format: {
              paramName: x.param.name,
              scope: context.emitterName,
            },
          }),
        );
      }
      continue;
    }
    filteredParams.push(x);
  }
  retval.parameters = filteredParams.map((x) =>
    diagnostics.pipe(getSdkHttpParameter(context, x.param, httpOperation.operation, x, x.type)),
  ) as (SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkCookieParameter)[];
  const headerParams = retval.parameters.filter(
    (x): x is SdkHeaderParameter => x.kind === "header",
  );
  // add operation info onto body param
  const tspBody = httpOperation.parameters.body;
  if (tspBody) {
    if (tspBody.property && !isNeverOrVoidType(tspBody.property.type)) {
      const bodyParam = diagnostics.pipe(
        getSdkHttpParameter(context, tspBody.property, httpOperation.operation, undefined, "body"),
      );
      if (bodyParam.kind !== "body") {
        diagnostics.add(
          createDiagnostic({
            code: "unexpected-http-param-type",
            target: tspBody.property,
            format: {
              paramName: tspBody.property.name,
              expectedType: "body",
              actualType: bodyParam.kind,
            },
          }),
        );
        return diagnostics.wrap(retval);
      }
      retval.bodyParam = bodyParam;
    } else if (!isNeverOrVoidType(tspBody.type)) {
      const type = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, getHttpBodyType(tspBody), httpOperation.operation),
      );
      const name = camelCase((type as { name: string }).name ?? "body");
      retval.bodyParam = {
        kind: "body",
        name,
        isGeneratedName: true,
        serializedName: "",
        doc: getClientDoc(context, tspBody.type),
        summary: getSummary(context.program, tspBody.type),
        onClient: false,
        contentTypes: [],
        defaultContentType: "application/json", // actual content type info is added later
        isApiVersionParam: false,
        apiVersions: getAvailableApiVersions(context, tspBody.type, httpOperation.operation),
        type,
        optional: isHttpBodySpread(tspBody) ? false : (tspBody.property?.optional ?? false), // optional is always false for spread body
        correspondingMethodParams: [],
        methodParameterSegments: [],
        crossLanguageDefinitionId: `${getCrossLanguageDefinitionId(context, httpOperation.operation)}.body`,
        decorators: diagnostics.pipe(getTypeDecorators(context, tspBody.type)),
        access: "public",
        flatten: false,
        serializationOptions: {},
      };
    }
    if (retval.bodyParam) {
      retval.bodyParam.methodParameterSegments = diagnostics.pipe(
        getMethodParameterSegments(
          context,
          httpOperation.operation,
          methodParameters,
          methodParametersMap,
          retval.bodyParam,
        ),
      );
      // Derive correspondingMethodParams from methodParameterSegments (last element of each path)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      retval.bodyParam.correspondingMethodParams = retval.bodyParam.methodParameterSegments.map(
        (segment) => segment[segment.length - 1],
      );

      addContentTypeInfoToBodyParam(context, httpOperation, retval.bodyParam);

      // populate serialization options based on content types
      retval.bodyParam.serializationOptions = buildSerializationOptionsFromContentTypes(
        retval.bodyParam.contentTypes,
        retval.bodyParam.serializedName,
      );

      // map stream request body type to bytes, but preserve stream metadata
      const requestStreamMeta = getStreamMetadata(context.program, httpOperation.parameters);
      if (requestStreamMeta) {
        retval.bodyParam.type = diagnostics.pipe(
          getStreamAsBytes(context, retval.bodyParam.type.__raw!),
        );
        retval.bodyParam.streamMetadata = diagnostics.pipe(
          buildSdkStreamMetadata(context, requestStreamMeta, httpOperation.operation),
        );
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        retval.bodyParam.correspondingMethodParams.map((p) => (p.type = retval.bodyParam!.type));
      }
    }
  }
  if (retval.bodyParam && !headerParams.some((h) => isContentTypeHeader(h))) {
    // if we have a body param and no content type header, we add one
    const contentTypeBase = {
      ...createContentTypeOrAcceptHeader(context, httpOperation, retval.bodyParam),
      doc: `Body parameter's content type. Known values are ${retval.bodyParam.contentTypes}`,
    };
    let methodParameter: SdkMethodParameter | undefined = methodParameters.find(
      (m) => m.name === "contentType",
    );
    if (!methodParameter) {
      methodParameter = {
        ...contentTypeBase,
        kind: "method",
      };
      methodParameters.push(methodParameter);
    }
    retval.parameters.push({
      ...contentTypeBase,
      kind: "header",
      serializedName: "Content-Type",
      correspondingMethodParams: [methodParameter],
      methodParameterSegments: [[methodParameter]],
    });
  }
  if (responseBody && !headerParams.some((h) => isAcceptHeader(h))) {
    // If our operation returns a body, we add an accept header if none exist
    const acceptBase = {
      ...createContentTypeOrAcceptHeader(context, httpOperation, responseBody),
    };
    let methodParameter: SdkMethodParameter | undefined = methodParameters.find(
      (m) => m.name === "accept",
    );
    if (!methodParameter) {
      methodParameter = {
        ...acceptBase,
        kind: "method",
      };
      methodParameters.push(methodParameter);
    }
    retval.parameters.push({
      ...acceptBase,
      kind: "header",
      serializedName: "Accept",
      correspondingMethodParams: [methodParameter],
      methodParameterSegments: [[methodParameter]],
    });
  }
  for (const param of retval.parameters) {
    if (param.methodParameterSegments.length > 0) continue;
    param.methodParameterSegments = diagnostics.pipe(
      getMethodParameterSegments(
        context,
        httpOperation.operation,
        methodParameters,
        methodParametersMap,
        param,
      ),
    );
    // Derive correspondingMethodParams from methodParameterSegments (last element of each path)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    param.correspondingMethodParams = param.methodParameterSegments.map(
      (segment) => segment[segment.length - 1],
    );
  }
  return diagnostics.wrap(retval);
}

function createContentTypeOrAcceptHeader(
  context: TCGCContext,
  httpOperation: HttpOperation,
  bodyObject: SdkBodyParameter | SdkHttpResponse | SdkHttpErrorResponse,
): Omit<SdkMethodParameter, "kind"> {
  const name = bodyObject.kind === "body" ? "contentType" : "accept";
  let type: SdkType = getTypeSpecBuiltInType(context, "string");
  // Honor the content types from the HTTP library result.
  // For a single content type, create a constant.
  // For multiple content types on a request body (`contentType`), create an enum since the
  // caller actually picks one value to send.
  // For multiple content types on a response (`accept`), create a single constant whose value
  // is a comma-joined list of all response content types, with structured content types
  // (JSON/XML/text-plain) listed first. This avoids treating the synthetic `accept` parameter
  // as a content-negotiation parameter. Services that genuinely need content negotiation
  // should use `@sharedRoute` to split the operation per content type.
  // For File type bodies, the content type is constrained by the File type itself;
  // treat it the same as a user-defined content type/accept parameter.
  if (bodyObject.contentTypes && bodyObject.contentTypes.length > 0) {
    const tk = $(context.program);
    context.__namingContextPath.push({
      name: httpOperation.operation.name,
      type: httpOperation.operation,
    });
    context.__namingContextPath.push({
      name: name === "accept" ? "Accept" : "ContentType",
      type: undefined,
    });
    try {
      if (bodyObject.contentTypes.length === 1) {
        // Single content type → constant.
        const literal = tk.literal.createString(bodyObject.contentTypes[0]);
        type = getSdkConstant(context, literal, httpOperation.operation);
      } else if (name === "accept") {
        // Multi accept → single constant whose value is a comma-joined string. Stable
        // partition: structured content types first, others after, preserving order.
        const isStructured = (ct: string) =>
          isMediaTypeJson(ct) || isMediaTypeXml(ct) || isMediaTypeTextPlain(ct);
        const structured = bodyObject.contentTypes.filter(isStructured);
        const others = bodyObject.contentTypes.filter((ct) => !isStructured(ct));
        const combined = [...structured, ...others].join(", ");
        const literal = tk.literal.createString(combined);
        type = getSdkConstant(context, literal, httpOperation.operation);
      } else {
        // Multi content types on request → enum.
        const union = tk.union.create(
          bodyObject.contentTypes.map((ct) => tk.literal.createString(ct)),
        );
        type = getClientType(context, union, httpOperation.operation);
      }
    } finally {
      context.__namingContextPath.pop();
      context.__namingContextPath.pop();
    }
  }
  const optional = bodyObject.kind === "body" ? bodyObject.optional : false;
  // No need for clientDefaultValue because it's a constant, it only has one value
  return {
    type,
    name,
    isGeneratedName: true,
    apiVersions: bodyObject.apiVersions,
    isApiVersionParam: false,
    onClient: false,
    optional: optional,
    crossLanguageDefinitionId: `${getCrossLanguageDefinitionId(context, httpOperation.operation)}.${name}`,
    decorators: [],
    access: "public",
    flatten: false,
  };
}

function addContentTypeInfoToBodyParam(
  context: TCGCContext,
  httpOperation: HttpOperation,
  bodyParam: SdkBodyParameter,
): readonly Diagnostic[] {
  const diagnostics = createDiagnosticCollector();
  const tspBody = httpOperation.parameters.body;
  if (!tspBody) return diagnostics.diagnostics;
  const contentTypes = tspBody.contentTypes;
  compilerAssert(contentTypes.length > 0, "contentTypes should not be empty"); // this should be http lib bug
  const defaultContentType = contentTypes.includes("application/json")
    ? "application/json"
    : contentTypes[0];
  bodyParam.contentTypes = contentTypes;
  bodyParam.defaultContentType = defaultContentType;
  diagnostics.pipe(addEncodeInfo(context, bodyParam.__raw!, bodyParam.type, defaultContentType));
  // set the correct encode for body parameter of method according to the content-type
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  if (bodyParam.correspondingMethodParams.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const methodBodyParam = bodyParam.correspondingMethodParams[0];
    diagnostics.pipe(
      addEncodeInfo(
        context,
        methodBodyParam.__raw!,
        methodBodyParam.type,
        bodyParam.defaultContentType,
      ),
    );
  }
  return diagnostics.diagnostics;
}

/**
 * Generate TCGC Http parameter type, `httpParam` or `location` should be provided at least one
 * @param context
 * @param param TypeSpec param for the http parameter
 * @param operation
 * @param httpParam TypeSpec Http parameter type
 * @param location Location of the http parameter
 * @returns
 */
export function getSdkHttpParameter(
  context: TCGCContext,
  param: ModelProperty,
  operation?: Operation,
  httpParam?: HttpOperationParameter,
  location?: "path" | "query" | "header" | "body" | "cookie",
): [SdkHttpParameter, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const base = diagnostics.pipe(getSdkModelPropertyTypeBase(context, param, operation));
  const program = context.program;
  if (isPathParam(context.program, param) || location === "path") {
    return diagnostics.wrap({
      ...base,
      kind: "path",
      explode: (httpParam as HttpOperationPathParameter)?.explode ?? false,
      style: (httpParam as HttpOperationPathParameter)?.style ?? "simple",
      // url type need allow reserved
      allowReserved:
        (httpParam as HttpOperationPathParameter)?.allowReserved ??
        $(program).type.isAssignableTo(param.type, $(program).builtin.url, param.type),
      serializedName: getPathParamName(program, param) ?? base.name,
      correspondingMethodParams: [],
      methodParameterSegments: [],
      optional: param.optional,
    });
  }
  if (isCookieParam(context.program, param) || location === "cookie") {
    return diagnostics.wrap({
      ...base,
      kind: "cookie",
      serializedName: getCookieParamOptions(program, param)?.name ?? base.name,
      correspondingMethodParams: [],
      methodParameterSegments: [],
      optional: param.optional,
    });
  }
  if (isBody(context.program, param) || location === "body") {
    const serializedName = param.name === "" ? "body" : getWireName(context, param);
    return diagnostics.wrap({
      ...base,
      kind: "body",
      serializedName,
      contentTypes: ["application/json"],
      defaultContentType: "application/json",
      optional: param.optional,
      correspondingMethodParams: [],
      methodParameterSegments: [],
      serializationOptions: buildSerializationOptionsFromContentTypes(
        ["application/json"],
        serializedName,
      ),
    });
  }
  const headerQueryBase = {
    ...base,
    optional: param.optional,
    collectionFormat: diagnostics.pipe(getCollectionFormat(context, param)),
    correspondingMethodParams: [],
    methodParameterSegments: [],
  };
  if (isQueryParam(context.program, param) || location === "query") {
    return diagnostics.wrap({
      ...headerQueryBase,
      kind: "query",
      serializedName: getQueryParamName(program, param) ?? base.name,
      explode: (httpParam as HttpOperationQueryParameter)?.explode,
    });
  }
  if (!(isHeader(context.program, param) || location === "header")) {
    diagnostics.add(
      createDiagnostic({
        code: "unexpected-http-param-type",
        target: param,
        format: {
          paramName: param.name,
          expectedType: "path, query, header, or body",
          actualType: param.kind,
        },
      }),
    );
  }
  return diagnostics.wrap({
    ...headerQueryBase,
    kind: "header",
    serializedName:
      getHeaderFieldName(program, param) ??
      (httpParam as HttpOperationHeaderParameter)?.name ??
      base.name,
  });
}

function getSdkHttpResponseAndExceptions(
  context: TCGCContext,
  httpOperation: HttpOperation,
  client: SdkClientType<SdkHttpOperation>,
): [
  {
    responses: SdkHttpResponse[];
    exceptions: SdkHttpErrorResponse[];
  },
  readonly Diagnostic[],
] {
  const tk = $(context.program);
  const diagnostics = createDiagnosticCollector();
  const responses: SdkHttpResponse[] = [];
  const exceptions: SdkHttpErrorResponse[] = [];
  for (const response of httpOperation.responses) {
    const headers: SdkServiceResponseHeader[] = [];
    const bodyTypes: Type[] = [];
    let type: SdkType | undefined;
    let contentTypes: string[] = [];
    let streamMetadata: SdkStreamMetadata | undefined;
    let lastBodyProperty: ModelProperty | undefined;
    let lastDefaultContentType: string | undefined;

    for (const innerResponse of response.responses) {
      const defaultContentType = innerResponse.body?.contentTypes.includes("application/json")
        ? "application/json"
        : innerResponse.body?.contentTypes[0];
      for (const header of getHttpOperationResponseHeaders(innerResponse)) {
        if (isNeverOrVoidType(header.type)) continue;
        headers.push({
          ...diagnostics.pipe(
            getSdkModelPropertyTypeBase(context, header, httpOperation.operation),
          ),
          __raw: header,
          kind: "responseheader",
          serializedName:
            getHeaderFieldName(context.program, header) ??
            (header === innerResponse.body?.contentTypeProperty ? "Content-Type" : header.name),
        });
        context.__responseHeaderCache.set(header, headers[headers.length - 1]);
      }
      if (innerResponse.body && !isNeverOrVoidType(innerResponse.body.type)) {
        if (bodyTypes.length > 0 && !bodyTypes.includes(innerResponse.body.type)) {
          diagnostics.add(
            createDiagnostic({
              code: "multiple-response-types",
              target: innerResponse.body.type,
              format: {
                operation: httpOperation.operation.name,
              },
            }),
          );
        }
        if (!bodyTypes.includes(innerResponse.body.type)) {
          bodyTypes.push(innerResponse.body.type);
        }
        contentTypes = contentTypes.concat(innerResponse.body.contentTypes);
        lastBodyProperty = innerResponse.body.property;
        lastDefaultContentType = defaultContentType;
        const responseStreamMeta = getStreamMetadata(context.program, innerResponse);
        if (responseStreamMeta) {
          // map stream response body type to bytes, but preserve stream metadata
          type = diagnostics.pipe(getStreamAsBytes(context, innerResponse.body.type));
          streamMetadata = diagnostics.pipe(
            buildSdkStreamMetadata(context, responseStreamMeta, httpOperation.operation),
          );
        }
      }
    }

    // Create SDK type from collected body types after iteration
    let body: Type | undefined;
    if (!type && bodyTypes.length > 0) {
      if (bodyTypes.length === 1) {
        body = bodyTypes[0];
      } else {
        body = tk.union.create(bodyTypes);
      }
      body = body.kind === "Model" ? getEffectivePayloadType(context, body, Visibility.Read) : body;
      if (bodyTypes.length > 1) {
        // Push naming context for the synthetic union so it gets a proper generated name
        context.__namingContextPath.push({
          name: httpOperation.operation.name,
          type: httpOperation.operation,
        });
        context.__namingContextPath.push({
          name: "Response",
          type: body as Union,
        });
      }
      type = diagnostics.pipe(getClientTypeWithDiagnostics(context, body, httpOperation.operation));
      if (bodyTypes.length > 1) {
        context.__namingContextPath.pop();
        context.__namingContextPath.pop();
      }
      if (lastBodyProperty) {
        addEncodeInfo(context, lastBodyProperty, type, lastDefaultContentType);
      }
    }
    const sdkResponse = {
      __raw: response,
      type,
      headers,
      contentTypes: contentTypes.length > 0 ? contentTypes : undefined,
      defaultContentType: contentTypes.includes("application/json")
        ? "application/json"
        : contentTypes[0],
      apiVersions: getAvailableApiVersions(
        context,
        httpOperation.operation,
        getActualClientType(client.__raw),
      ),
      description: response.description,
      streamMetadata,
      serializationOptions: buildSerializationOptionsFromContentTypes(contentTypes),
    };

    if (
      response.statusCodes === "*" ||
      isErrorModel(context.program, response.type) ||
      (body && isErrorModel(context.program, body))
    ) {
      exceptions.push({
        ...sdkResponse,
        kind: "http",
        statusCodes: response.statusCodes,
      });
    } else {
      responses.push({
        ...sdkResponse,
        kind: "http",
        statusCodes: response.statusCodes,
      });
    }
  }
  return diagnostics.wrap({ responses, exceptions });
}

/**
 * Get method parameter segments for a service parameter.
 * This builds the complete path from method parameters to the HTTP parameter.
 * For body parameters with spread, multiple paths may be returned.
 * @param context
 * @param operation
 * @param methodParameters
 * @param serviceParam
 * @returns Array of path segments, where each inner array represents a complete path
 */
export function getMethodParameterSegments(
  context: TCGCContext,
  operation: Operation,
  methodParameters: SdkMethodParameter[],
  methodParametersMap: Map<ModelProperty, SdkMethodParameter>,
  serviceParam: SdkHttpParameter,
): [(SdkMethodParameter | SdkModelPropertyType)[][], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  if (serviceParam.onClient) {
    // 1. To see if the service parameter is a client parameter.
    if (serviceParam.__raw) {
      const correspondingClientParam = getCorrespondingClientParam(
        context,
        serviceParam.__raw,
        operation,
      );
      if (correspondingClientParam) return diagnostics.wrap([[correspondingClientParam]]);
    }

    const clientParams = context.__clientParametersCache.get(
      context.getClientForOperation(operation),
    );

    // 2. To see if the service parameter is api version parameter that has been elevated to client.
    if (clientParams && serviceParam.isApiVersionParam && serviceParam.onClient) {
      const existingApiVersion = clientParams.find((x) => isApiVersion(context, x.__raw!));
      if (existingApiVersion) return diagnostics.wrap([[existingApiVersion]]);
    }

    // 3. To see if the service parameter is subscription parameter that has been elevated to client (only for arm service).
    if (clientParams && isSubscriptionId(context, serviceParam)) {
      const subId = clientParams.find((x) => isSubscriptionId(context, x));
      if (subId) return diagnostics.wrap([[subId]]);
    }
  }

  // Since service param come from the original operation when using `@override`, so the `onClient` info might not be correct.
  // We need to reset the `onClient` info for the service param and find corresponding method param again.
  serviceParam.onClient = false;

  // 4. To see if the service parameter is a method parameter or a property of a method parameter.
  const directMappingPath = findMappingWithPath(
    context,
    methodParameters,
    methodParametersMap,
    serviceParam,
  );
  if (directMappingPath) {
    return diagnostics.wrap([directMappingPath]);
  }

  // 5. To see if all the property of the service parameter could be mapped to a method parameter or a property of a method parameter.
  // This is the spread body case where multiple paths may exist.
  if (serviceParam.kind === "body" && serviceParam.type.kind === "model") {
    const paths: (SdkMethodParameter | SdkModelPropertyType)[][] = [];
    let optionalSkip = 0;
    for (const serviceParamProp of serviceParam.type.properties) {
      const propertyMappingPath = findMappingWithPath(
        context,
        methodParameters,
        methodParametersMap,
        serviceParamProp,
      );
      if (propertyMappingPath) {
        paths.push(propertyMappingPath);
      } else if (serviceParamProp.optional) {
        // If the property is optional, we can skip the mapping.
        optionalSkip++;
      }
    }
    if (paths.length + optionalSkip === serviceParam.type.properties.length) {
      return diagnostics.wrap(paths);
    }
  }

  // If mapping could not be found, and the service param is required, TCGC will report error since we can't generate the client code without this mapping.
  if (!serviceParam.optional) {
    diagnostics.add(
      createDiagnostic({
        code: "no-corresponding-method-param",
        target: operation,
        format: {
          paramName: serviceParam.name,
          methodName: operation.name,
        },
      }),
    );
  }

  return diagnostics.wrap([]);
}

/**
 * Build path segments from method parameters to service parameter. The map could be a service parameter or a property of a service parameter to a method parameter or a property of a method parameter.
 * This function finds the complete path from method parameter to the HTTP parameter.
 * @param context
 * @param methodParameters
 * @param serviceParam
 * @returns An array of path segments, where each segment is a path from method parameter to the service parameter
 */
function findMappingWithPath(
  context: TCGCContext,
  methodParameters: SdkMethodParameter[],
  methodParametersMap: Map<ModelProperty, SdkMethodParameter>,
  serviceParam: SdkHttpParameter | SdkModelPropertyType,
): (SdkMethodParameter | SdkModelPropertyType)[] | undefined {
  // Quick check for direct mapping
  if (serviceParam.__raw && methodParametersMap.has(serviceParam.__raw)) {
    return [methodParametersMap.get(serviceParam.__raw)!];
  }

  // BFS with index-based traversal (O(1) dequeue) and parent pointers (avoid path copying per node)
  const queue: (SdkMethodParameter | SdkModelPropertyType)[] = [...methodParameters];
  const parentMap = new Map<
    SdkMethodParameter | SdkModelPropertyType,
    SdkMethodParameter | SdkModelPropertyType | undefined
  >();
  for (const p of methodParameters) {
    parentMap.set(p, undefined);
  }
  const visited: Set<SdkModelType> = new Set();
  let front = 0;

  while (front < queue.length) {
    const methodParam = queue[front++];

    // HTTP operation parameter/body parameter/property of body parameter could either from an operation parameter directly or from a property of an operation parameter.
    if (
      methodParam.__raw &&
      serviceParam.__raw &&
      compareModelProperties(context.program, methodParam.__raw, serviceParam.__raw)
    ) {
      return buildPathFromParentMap(methodParam, parentMap);
    }

    // If the service parameter is a body parameter, try to see if we could find a method parameter with same type of the body parameter.
    if (serviceParam.kind === "body" && serviceParam.type === methodParam.type) {
      return buildPathFromParentMap(methodParam, parentMap);
    }

    // BFS to explore nested properties
    if (methodParam.type.kind === "model" && !visited.has(methodParam.type)) {
      visited.add(methodParam.type);
      let current: SdkModelType | undefined = methodParam.type;
      while (current) {
        for (const prop of current.properties) {
          parentMap.set(prop, methodParam);
          queue.push(prop);
        }
        current = current.baseModel;
      }
    }
  }
  return undefined;
}

function buildPathFromParentMap(
  node: SdkMethodParameter | SdkModelPropertyType,
  parentMap: Map<
    SdkMethodParameter | SdkModelPropertyType,
    SdkMethodParameter | SdkModelPropertyType | undefined
  >,
): (SdkMethodParameter | SdkModelPropertyType)[] {
  const path: (SdkMethodParameter | SdkModelPropertyType)[] = [];
  let current: SdkMethodParameter | SdkModelPropertyType | undefined = node;
  while (current !== undefined) {
    path.push(current);
    current = parentMap.get(current);
  }
  return path.reverse();
}

function filterOutUselessPathParameters(
  context: TCGCContext,
  httpOperation: HttpOperation,
  methodParameters: SdkMethodParameter[],
) {
  // there are some cases that method path parameter is not in operation:
  // 1. autoroute with constant parameter
  // 2. singleton arm resource name
  // 3. visibility mis-match
  // so we will remove the method parameter for consistent
  for (let i = 0; i < methodParameters.length; i++) {
    const param = methodParameters[i];
    if (
      param.__raw &&
      isPathParam(context.program, param.__raw) &&
      httpOperation.parameters.parameters.filter(
        (p) =>
          p.type === "path" &&
          p.name === (getPathParamName(context.program, param.__raw!) ?? param.name),
      ).length === 0
    ) {
      methodParameters.splice(i, 1);
      i--;
    }
  }
}

function filterOutReadOnlyParameters(methodParameters: SdkMethodParameter[]) {
  // ReadOnly parameters should not be included in method parameters
  // since they cannot be set by the user
  for (let i = 0; i < methodParameters.length; i++) {
    const param = methodParameters[i];
    if (isReadOnly(param)) {
      methodParameters.splice(i, 1);
      i--;
    }
  }
}

function getCollectionFormat(
  context: TCGCContext,
  type: ModelProperty,
): [CollectionFormat | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const program = context.program;
  if (isHeader(program, type)) {
    return getFormatFromExplodeOrEncode(
      context,
      type,
      getHeaderFieldOptions(program, type).explode,
    );
  } else if (isQueryParam(program, type)) {
    return getFormatFromExplodeOrEncode(
      context,
      type,
      getQueryParamOptions(program, type)?.explode,
    );
  }
  return diagnostics.wrap(undefined);
}

function getFormatFromExplodeOrEncode(
  context: TCGCContext,
  type: ModelProperty,
  explode?: boolean,
): [CollectionFormat | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if ($(context.program).array.is(type.type)) {
    if (explode) {
      return diagnostics.wrap("multi");
    }
    const encode = getEncode(context.program, type);
    if (encode) {
      if (encode?.encoding === "ArrayEncoding.pipeDelimited") {
        return diagnostics.wrap("pipes");
      }
      if (encode?.encoding === "ArrayEncoding.spaceDelimited") {
        return diagnostics.wrap("ssv");
      }
      diagnostics.add(
        createDiagnostic({
          code: "invalid-encode-for-collection-format",
          target: type,
        }),
      );
    }
    return diagnostics.wrap("csv");
  }
  return diagnostics.wrap(undefined);
}
