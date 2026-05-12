import {
  compilerAssert,
  createDiagnosticCollector,
  Diagnostic,
  getSummary,
  ignoreDiagnostics,
  isList,
  ModelProperty,
  Operation,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  getAccess,
  getDisablePageable,
  getMarkAsPageable,
  getNextLinkVerb,
  getOverriddenClientMethod,
  getResponseAsBool,
  isInScope,
  listOperationsInClient,
  shouldGenerateConvenient,
  shouldGenerateProtocol,
} from "./decorators.js";
import { getSdkHttpOperation } from "./http.js";
import {
  SdkArrayType,
  SdkBuiltInType,
  SdkClient,
  SdkClientType,
  SdkMethod,
  SdkMethodParameter,
  SdkMethodResponse,
  SdkModelPropertyType,
  SdkModelType,
  SdkPagingServiceMethod,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkStreamMetadata,
  SdkType,
  TCGCContext,
  UsageFlags,
} from "./interfaces.js";
import {
  createGeneratedName,
  findRootSourceProperty,
  getActualClientType,
  getAvailableApiVersions,
  getClientDoc,
  getCorrespondingClientParam,
  getHashForType,
  getTypeDecorators,
  isNeverOrVoidType,
  isSubscriptionId,
} from "./internal-utils.js";
import { createDiagnostic } from "./lib.js";
import {
  getCrossLanguageDefinitionId,
  getHttpOperationWithCache,
  getLibraryName,
} from "./public-utils.js";
import {
  getClientTypeWithDiagnostics,
  getSdkBuiltInType,
  getSdkModelPropertyType,
  getSdkModelPropertyTypeBase,
} from "./types.js";

function getSdkServiceOperation<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  operation: Operation,
  methodParameters: SdkMethodParameter[],
  client: SdkClientType<TServiceOperation>,
): [TServiceOperation, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const httpOperation = getHttpOperationWithCache(context, operation);
  if (httpOperation) {
    const sdkHttpOperation = diagnostics.pipe(
      getSdkHttpOperation(context, httpOperation, methodParameters, client),
    ) as TServiceOperation;
    return diagnostics.wrap(sdkHttpOperation);
  }
  diagnostics.add(
    createDiagnostic({
      code: "unsupported-protocol",
      target: operation,
      format: {},
    }),
  );
  return diagnostics.wrap(undefined as any);
}

function getPageSizeParameterSegments<TServiceOperation extends SdkServiceOperation>(
  baseServiceMethod: SdkServiceMethod<TServiceOperation>,
): (SdkModelPropertyType | SdkMethodParameter)[] {
  function recurseToFindPageSizeParameterInModel(
    param: SdkMethodParameter,
    model: SdkModelType,
  ): (SdkModelPropertyType | SdkMethodParameter)[] {
    for (const prop of model.properties) {
      if (prop.__raw && prop.__raw.decorators.find((d) => d.definition?.name === "@pageSize")) {
        return [param, prop];
      }
      if (prop.type.kind === "model") {
        const nested = recurseToFindPageSizeParameterInModel(param, prop.type);
        if (nested.length > 0) {
          return nested;
        }
      }
    }
    return [];
  }
  for (const p of baseServiceMethod.parameters) {
    if (p.__raw && p.__raw.decorators.find((d) => d.definition?.name === "@pageSize")) {
      return [p];
    }
    if (p.type.kind === "model") {
      return recurseToFindPageSizeParameterInModel(p, p.type);
    }
  }
  return [];
}

function getSdkPagingServiceMethod<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  operation: Operation,
  client: SdkClientType<TServiceOperation>,
): [SdkPagingServiceMethod<TServiceOperation>, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  const baseServiceMethod = diagnostics.pipe(
    getSdkBasicServiceMethod<TServiceOperation>(context, operation, client),
  );

  // If the response body type itself is nullable (e.g., {@body body: Type | null}), unwrap it for paging/LRO processing
  let responseType = baseServiceMethod.response.type;
  if (responseType?.kind === "nullable") {
    responseType = responseType.type;
  }

  // normal paging
  if (isList(context.program, operation)) {
    const pagingMetadata = $(context.program).operation.getPagingMetadata(
      getOverriddenClientMethod(context, operation) ?? operation,
    );

    if (responseType?.__raw?.kind !== "Model" || responseType.kind !== "model" || !pagingMetadata) {
      diagnostics.add(
        createDiagnostic({
          code: "unexpected-pageable-operation-return-type",
          target: operation,
          format: {
            operationName: operation.name,
          },
        }),
      );
      // return as page method with no paging info
      return diagnostics.wrap({
        ...baseServiceMethod,
        kind: "paging",
        pagingMetadata: {},
      });
    }

    const resultSegments = mapFirstSegmentForResultSegments(
      pagingMetadata.output.pageItems.path,
      baseServiceMethod.response,
    );
    const nextLinkSegments = mapFirstSegmentForResultSegments(
      pagingMetadata.output.nextLink?.path,
      baseServiceMethod.response,
    );
    const continuationTokenResponseSegments = mapFirstSegmentForResultSegments(
      pagingMetadata.output.continuationToken?.path,
      baseServiceMethod.response,
    );

    baseServiceMethod.response.resultSegments = resultSegments?.map(
      (resultSegment) => context.__modelPropertyCache.get(resultSegment)!,
    );

    context.__pagedResultSet.add(responseType);
    // tcgc will let all paging method return a list of items
    baseServiceMethod.response.type = diagnostics.pipe(
      getClientTypeWithDiagnostics(
        context,
        pagingMetadata.output.pageItems.property.type,
        operation,
      ),
    );

    return diagnostics.wrap({
      ...baseServiceMethod,
      kind: "paging",
      pagingMetadata: {
        __raw: pagingMetadata,
        nextLinkSegments: nextLinkSegments?.map(
          (segment) =>
            context.__responseHeaderCache.get(segment) ??
            context.__modelPropertyCache.get(segment)!,
        ),
        nextLinkVerb: getNextLinkVerb(context, operation),
        continuationTokenParameterSegments: pagingMetadata.input.continuationToken?.path.map(
          (r) => context.__methodParameterCache.get(r) ?? context.__modelPropertyCache.get(r)!,
        ),
        continuationTokenResponseSegments: continuationTokenResponseSegments?.map(
          (segment) =>
            context.__responseHeaderCache.get(segment) ??
            context.__modelPropertyCache.get(segment)!,
        ),
        pageItemsSegments: baseServiceMethod.response.resultSegments,
        pageSizeParameterSegments: getPageSizeParameterSegments(baseServiceMethod),
        nextLinkReInjectedParametersSegments: undefined,
      },
    });
  } else {
    const markAsPageableInfo = getMarkAsPageable(context, operation);
    if (markAsPageableInfo) {
      const itemsProperty = diagnostics.pipe(
        getSdkModelPropertyType(context, markAsPageableInfo.itemsProperty, operation),
      );

      // Set resultSegments to match the behavior of normal paging operations
      baseServiceMethod.response.resultSegments = [itemsProperty];

      if (responseType) {
        context.__pagedResultSet.add(responseType);
      }
      // tcgc will let all paging method return a list of items
      baseServiceMethod.response.type = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, markAsPageableInfo.itemsProperty.type, operation),
      );

      return diagnostics.wrap({
        ...baseServiceMethod,
        kind: "paging",
        pagingMetadata: {
          __raw: undefined, // because in this case it is not a real paging operation
          pageItemsSegments: baseServiceMethod.response.resultSegments,
        },
      });
    } else {
      compilerAssert(false, "Unexpected operation should be paged if calling this function");
    }
  }
}

function mapFirstSegmentForResultSegments(
  resultSegments: ModelProperty[] | undefined,
  response: SdkMethodResponse,
): ModelProperty[] | undefined {
  if (resultSegments === undefined || response === undefined) return undefined;
  // TCGC use Http response type as the return type
  // For implicit body response, we need to locate the first segment in the response type
  // Several cases:
  // 1. `op test(): {items, nextLink}`
  // 2. `op test(): {items, nextLink} & {a, b, c}`
  // 3. `op test(): {@bodyRoot body: {items, nextLink}}`
  const responseModel =
    response.type?.kind === "model"
      ? response.type
      : response.type?.kind === "nullable" && response.type.type.kind === "model"
        ? response.type.type
        : undefined;
  if (resultSegments.length > 0 && responseModel) {
    for (let i = 0; i < resultSegments.length; i++) {
      const segment = resultSegments[i];
      let current: SdkModelType | undefined = responseModel;
      while (current) {
        for (const property of current.properties ?? []) {
          if (
            property.__raw &&
            findRootSourceProperty(property.__raw) === findRootSourceProperty(segment)
          ) {
            return [property.__raw, ...resultSegments.slice(i + 1)];
          }
        }
        current = current.baseModel;
      }
    }
  }
  return resultSegments;
}

export function getPropertySegmentsFromModelOrParameters(
  source: SdkModelType | SdkMethodParameter[],
  predicate: (property: SdkMethodParameter | SdkModelPropertyType) => boolean,
): (SdkMethodParameter | SdkModelPropertyType)[] | undefined {
  const queue: { model: SdkModelType; path: (SdkMethodParameter | SdkModelPropertyType)[] }[] = [];

  if (!Array.isArray(source)) {
    if (source.baseModel) {
      const baseResult = getPropertySegmentsFromModelOrParameters(source.baseModel, predicate);
      if (baseResult) return baseResult;
    }
  }

  for (const prop of Array.isArray(source) ? source : source.properties.values()) {
    if (predicate(prop)) {
      return [prop];
    }
    if (prop.type.kind === "model") {
      queue.push({ model: prop.type, path: [prop] });
    }
  }

  let queueIdx = 0;
  while (queueIdx < queue.length) {
    const { model, path } = queue[queueIdx++];
    for (const prop of model.properties.values()) {
      if (predicate(prop)) {
        return path.concat(prop);
      }
      if (prop.type.kind === "model") {
        queue.push({ model: prop.type, path: path.concat(prop) });
      }
    }
  }

  return undefined;
}


function getSdkMethodResponse(
  context: TCGCContext,
  operation: Operation,
  sdkOperation: SdkServiceOperation,
  client: SdkClientType<SdkServiceOperation>,
): SdkMethodResponse {
  const responses = sdkOperation.responses;

  const allResponseBodies: SdkType[] = [];
  let containsResponseWithoutBody = false;
  responses.forEach((response) => {
    if (response.type) {
      allResponseBodies.push(response.type);
    } else {
      containsResponseWithoutBody = true;
    }
  });

  const responseTypes = new Set<string>(allResponseBodies.map((x) => getHashForType(x)));
  let type: SdkType | undefined = undefined;
  if (getResponseAsBool(context, operation)) {
    type = getSdkBuiltInType(context, $(context.program).builtin.boolean);
  } else {
    if (responseTypes.size > 1) {
      // return union of all the different types
      type = {
        __raw: operation,
        kind: "union",
        access: "public",
        usage: UsageFlags.Output,
        variantTypes: allResponseBodies,
        name: createGeneratedName(context, operation, "UnionResponse"),
        isGeneratedName: true,
        namespace: client.namespace,
        crossLanguageDefinitionId: `${getCrossLanguageDefinitionId(context, operation)}.UnionResponse`,
        decorators: [],
      };
    } else if (responseTypes.size === 1) {
      type = allResponseBodies[0];
    }
  }

  // Set optional property based on whether responses have bodies
  // If type is undefined (no response), optional remains undefined
  // For @responseAsBool, the boolean return is never optional — it's always true or false
  let optional: boolean | undefined = undefined;
  if (type !== undefined && !getResponseAsBool(context, operation)) {
    // If we have a response type, set optional based on whether some responses lack bodies
    optional = containsResponseWithoutBody;
  }

  // Propagate stream metadata from HTTP responses to method response
  let streamMetadata: SdkStreamMetadata | undefined;
  for (const response of responses) {
    if (response.streamMetadata) {
      streamMetadata = response.streamMetadata;
      break;
    }
  }

  return {
    kind: "method",
    type,
    ...(optional !== undefined && { optional }),
    ...(streamMetadata && { streamMetadata }),
  };
}

export function getSdkBasicServiceMethod<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  operation: Operation,
  client: SdkClientType<TServiceOperation>,
): [SdkServiceMethod<TServiceOperation>, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const methodParameters: SdkMethodParameter[] = [];
  // we have to calculate apiVersions first, so that the information is put
  // in __tspTypeToApiVersions before we call parameters since method wraps parameter
  const apiVersions = getAvailableApiVersions(
    context,
    operation,
    getActualClientType(client.__raw),
  );

  let clientParams = context.__clientParametersCache.get(client.__raw);
  if (!clientParams) {
    clientParams = [];
    context.__clientParametersCache.set(client.__raw, clientParams);
  }

  const override = getOverriddenClientMethod(context, operation);
  const params = (override ?? operation).parameters.properties.values();

  for (const param of params) {
    if (isNeverOrVoidType(param.type)) continue;
    // Skip parameters that are not in scope for this emitter
    if (!isInScope(context, param)) continue;
    const sdkMethodParam = diagnostics.pipe(getSdkMethodParameter(context, param, operation));
    if (sdkMethodParam.onClient) {
      // add API version and subscription ID parameters to the client parameters
      if (sdkMethodParam.isApiVersionParam) {
        if (!clientParams.find((x) => x.isApiVersionParam)) {
          clientParams.push(sdkMethodParam);
        }
      } else if (isSubscriptionId(context, param)) {
        if (!clientParams.find((x) => isSubscriptionId(context, x))) {
          clientParams.push(sdkMethodParam);
        }
      }
    } else {
      methodParameters.push(sdkMethodParam);
    }
  }

  const serviceOperation = diagnostics.pipe(
    getSdkServiceOperation<TServiceOperation>(context, operation, methodParameters, client),
  );
  const response = getSdkMethodResponse(context, operation, serviceOperation, client);
  const name = getLibraryName(context, operation);
  return diagnostics.wrap({
    __raw: operation,
    kind: "basic",
    name,
    access: getAccess(context, operation) ?? "public",
    parameters: methodParameters,
    doc: getClientDoc(context, operation),
    summary: getSummary(context.program, operation),
    operation: serviceOperation,
    response,
    apiVersions,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, operation),
    decorators: diagnostics.pipe(getTypeDecorators(context, operation)),
    generateConvenient: shouldGenerateConvenient(context, operation),
    generateProtocol: shouldGenerateProtocol(context, operation),
    isOverride: override !== undefined,
  });
}

function getSdkServiceMethod<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  operation: Operation,
  client: SdkClientType<TServiceOperation>,
): [SdkServiceMethod<TServiceOperation>, readonly Diagnostic[]] {
  // `@disablePageable` disables paging even for operations with @list
  const pagingDisabled = getDisablePageable(context, operation);
  const paging =
    !pagingDisabled &&
    (isList(context.program, operation) || getMarkAsPageable(context, operation));
  if (paging) {
    return getSdkPagingServiceMethod<TServiceOperation>(context, operation, client);
  }
  return getSdkBasicServiceMethod<TServiceOperation>(context, operation, client);
}

export function getSdkMethodParameter(
  context: TCGCContext,
  type: ModelProperty,
  operation?: Operation,
): [SdkMethodParameter, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  let property = context.__methodParameterCache?.get(type);

  if (!property) {
    // for parameter that has elevated to client or parent client, we will use the client parameter directly
    if (operation) {
      const correspondingClientParam = getCorrespondingClientParam(context, type, operation);
      if (correspondingClientParam) return diagnostics.wrap(correspondingClientParam);
    }

    property = {
      ...diagnostics.pipe(getSdkModelPropertyTypeBase(context, type, operation)),
      kind: "method",
    };

    context.__methodParameterCache.set(type, property);
  }
  return diagnostics.wrap(property);
}

export function createSdkMethods<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  client: SdkClient,
  sdkClientType: SdkClientType<TServiceOperation>,
): [SdkMethod<TServiceOperation>[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const retval: SdkMethod<TServiceOperation>[] = [];
  for (const operation of listOperationsInClient(context, client)) {
    retval.push(
      diagnostics.pipe(getSdkServiceMethod<TServiceOperation>(context, operation, sdkClientType)),
    );
  }
  return diagnostics.wrap(retval);
}
