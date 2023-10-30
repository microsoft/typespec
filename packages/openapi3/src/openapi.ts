import {
  compilerAssert,
  DiagnosticTarget,
  EmitContext,
  emitFile,
  getAllTags,
  getAnyExtensionFromPath,
  getDoc,
  getEncode,
  getFormat,
  getKnownValues,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
  getNamespaceFullName,
  getPattern,
  getService,
  getSummary,
  ignoreDiagnostics,
  interpolatePath,
  isArrayModelType,
  isDeprecated,
  isErrorType,
  isGlobalNamespace,
  isNeverType,
  isNullType,
  isSecret,
  isVoidType,
  listServices,
  ModelProperty,
  Namespace,
  navigateTypesInNamespace,
  NewLine,
  Operation,
  Program,
  ProjectionApplication,
  projectProgram,
  resolvePath,
  Scalar,
  Service,
  Type,
  TypeNameOptions,
} from "@typespec/compiler";

import { AssetEmitter, EmitEntity } from "@typespec/compiler/emitter-framework";
import {
  createMetadataInfo,
  getAuthentication,
  getHttpService,
  getServers,
  getStatusCodeDescription,
  HeaderFieldOptions,
  HttpAuth,
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationRequestBody,
  HttpOperationResponse,
  HttpOperationResponseContent,
  HttpServer,
  HttpStatusCodeRange,
  HttpStatusCodesEntry,
  HttpVerb,
  isContentTypeHeader,
  isOverloadSameEndpoint,
  MetadataInfo,
  QueryParameterOptions,
  reportIfNoRoutes,
  resolveRequestVisibility,
  ServiceAuthentication,
  Visibility,
} from "@typespec/http";
import {
  getExtensions,
  getExternalDocs,
  getInfo,
  getOpenAPITypeName,
  getParameterKey,
  isDefaultResponse,
  isReadonlyProperty,
  resolveOperationId,
  shouldInline,
} from "@typespec/openapi";
import { buildVersionProjections } from "@typespec/versioning";
import { stringify } from "yaml";
import { getRef } from "./decorators.js";
import { FileType, OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { OpenAPI3SchemaEmitter } from "./schema-emitter.js";
import {
  OpenAPI3Document,
  OpenAPI3Header,
  OpenAPI3OAuthFlows,
  OpenAPI3Operation,
  OpenAPI3Parameter,
  OpenAPI3ParameterBase,
  OpenAPI3Schema,
  OpenAPI3SecurityScheme,
  OpenAPI3Server,
  OpenAPI3ServerVariable,
  OpenAPI3StatusCode,
  Refable,
} from "./types.js";
import { deepEquals } from "./util.js";
import { resolveVisibilityUsage, VisibilityUsageTracker } from "./visibility-usage.js";

const defaultFileType: FileType = "yaml";
const defaultOptions = {
  "new-line": "lf",
  "omit-unreachable-types": false,
  "include-x-typespec-name": "never",
} as const;

export async function $onEmit(context: EmitContext<OpenAPI3EmitterOptions>) {
  const options = resolveOptions(context);
  const emitter = createOAPIEmitter(context, options);
  await emitter.emitOpenAPI();
}

function findFileTypeFromFilename(filename: string | undefined): FileType {
  if (filename === undefined) {
    return defaultFileType;
  }
  switch (getAnyExtensionFromPath(filename)) {
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".json":
      return "json";
    default:
      return defaultFileType;
  }
}
export function resolveOptions(
  context: EmitContext<OpenAPI3EmitterOptions>
): ResolvedOpenAPI3EmitterOptions {
  const resolvedOptions = { ...defaultOptions, ...context.options };

  const fileType =
    resolvedOptions["file-type"] ?? findFileTypeFromFilename(resolvedOptions["output-file"]);

  const outputFile =
    resolvedOptions["output-file"] ?? `openapi.{service-name}.{version}.${fileType}`;
  return {
    fileType,
    newLine: resolvedOptions["new-line"],
    omitUnreachableTypes: resolvedOptions["omit-unreachable-types"],
    includeXTypeSpecName: resolvedOptions["include-x-typespec-name"],
    outputFile: resolvePath(context.emitterOutputDir, outputFile),
  };
}

export interface ResolvedOpenAPI3EmitterOptions {
  fileType: FileType;
  outputFile: string;
  newLine: NewLine;
  omitUnreachableTypes: boolean;
  includeXTypeSpecName: "inline-only" | "never";
}

function createOAPIEmitter(
  context: EmitContext<OpenAPI3EmitterOptions>,
  options: ResolvedOpenAPI3EmitterOptions
) {
  let program = context.program;
  let schemaEmitter: AssetEmitter<OpenAPI3Schema, OpenAPI3EmitterOptions>;

  let root: OpenAPI3Document;

  // Get the service namespace string for use in name shortening
  let serviceNamespace: string | undefined;
  let currentPath: any;
  let currentEndpoint: OpenAPI3Operation;

  let metadataInfo: MetadataInfo;
  let visibilityUsage: VisibilityUsageTracker;

  // Keep track of inline types still in the process of having their schema computed
  // This is used to detect cycles in inline types, which is an
  let inProgressInlineTypes = new Set<Type>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/components/parameters. Inlined parameters do not go in
  // this map.
  let params: Map<ModelProperty, any>;

  // Keep track of models that have had properties spread into parameters. We won't
  // consider these unreferenced when emitting unreferenced types.
  let paramModels: Set<Type>;

  // De-dupe the per-endpoint tags that will be added into the #/tags
  let tags: Set<string>;

  const typeNameOptions: TypeNameOptions = {
    // shorten type names by removing TypeSpec and service namespace
    namespaceFilter(ns) {
      const name = getNamespaceFullName(ns);
      return name !== serviceNamespace;
    },
  };

  return { emitOpenAPI };

  function initializeEmitter(service: Service, version?: string) {
    metadataInfo = createMetadataInfo(program, {
      canonicalVisibility: Visibility.Read,
      canShareProperty: (p) => isReadonlyProperty(program, p),
    });
    visibilityUsage = resolveVisibilityUsage(program, metadataInfo, service.type);
    schemaEmitter = context.getAssetEmitter(
      class extends OpenAPI3SchemaEmitter {
        constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
          super(emitter, metadataInfo, visibilityUsage, options);
        }
      } as any
    );

    const auth = processAuth(service.type);

    root = {
      openapi: "3.0.0",
      info: {
        title: service.title ?? "(title)",
        version: version ?? service.version ?? "0000-00-00",
        description: getDoc(program, service.type),
        ...getInfo(program, service.type),
      },
      externalDocs: getExternalDocs(program, service.type),
      tags: [],
      paths: {},
      security: auth?.security,
      components: {
        parameters: {},
        requestBodies: {},
        responses: {},
        schemas: {},
        examples: {},
        securitySchemes: auth?.securitySchemes ?? {},
      },
    };
    const servers = getServers(program, service.type);
    if (servers) {
      root.servers = resolveServers(servers);
    }

    serviceNamespace = getNamespaceFullName(service.type);
    currentPath = root.paths;

    inProgressInlineTypes = new Set();
    params = new Map();
    paramModels = new Set();
    tags = new Set();
  }

  function isValidServerVariableType(program: Program, type: Type): boolean {
    switch (type.kind) {
      case "String":
      case "Union":
      case "Scalar":
        return ignoreDiagnostics(
          program.checker.isTypeAssignableTo(
            type.projectionBase ?? type,
            program.checker.getStdType("string"),
            type
          )
        );
      case "Enum":
        for (const member of type.members.values()) {
          if (member.value && typeof member.value !== "string") {
            return false;
          }
        }
        return true;
      default:
        return false;
    }
  }

  function validateValidServerVariable(program: Program, prop: ModelProperty) {
    const isValid = isValidServerVariableType(program, prop.type);

    if (!isValid) {
      reportDiagnostic(program, {
        code: "invalid-server-variable",
        format: { propName: prop.name },
        target: prop,
      });
    }
    return isValid;
  }

  function resolveServers(servers: HttpServer[]): OpenAPI3Server[] {
    return servers.map((server) => {
      const variables: Record<string, OpenAPI3ServerVariable> = {};
      for (const [name, prop] of server.parameters) {
        if (!validateValidServerVariable(program, prop)) {
          continue;
        }

        const variable: OpenAPI3ServerVariable = {
          default: prop.default ? getDefaultValue(prop.type, prop.default) : "",
          description: getDoc(program, prop),
        };

        if (prop.type.kind === "Enum") {
          variable.enum = getSchemaValue(prop.type, Visibility.Read).enum as any;
        } else if (prop.type.kind === "Union") {
          variable.enum = getSchemaValue(prop.type, Visibility.Read).enum as any;
        } else if (prop.type.kind === "String") {
          variable.enum = [prop.type.value];
        }
        attachExtensions(program, prop, variable);
        variables[name] = variable;
      }
      return {
        url: server.url,
        description: server.description,
        variables,
      };
    });
  }

  async function emitOpenAPI() {
    const services = listServices(program);
    if (services.length === 0) {
      services.push({ type: program.getGlobalNamespaceType() });
    }
    for (const service of services) {
      const commonProjections: ProjectionApplication[] = [
        {
          projectionName: "target",
          arguments: ["json"],
        },
      ];
      const originalProgram = program;
      const versions = buildVersionProjections(program, service.type);
      for (const record of versions) {
        const projectedProgram = (program = projectProgram(originalProgram, [
          ...commonProjections,
          ...record.projections,
        ]));
        const projectedServiceNs: Namespace = projectedProgram.projector.projectedTypes.get(
          service.type
        ) as Namespace;

        await emitOpenAPIFromVersion(
          projectedServiceNs === projectedProgram.getGlobalNamespaceType()
            ? { type: projectedProgram.getGlobalNamespaceType() }
            : getService(program, projectedServiceNs)!,
          services.length > 1,
          record.version
        );
      }
    }
  }

  function resolveOutputFile(service: Service, multipleService: boolean, version?: string): string {
    return interpolatePath(options.outputFile, {
      "service-name": multipleService ? getNamespaceFullName(service.type) : undefined,
      version,
    });
  }

  /**
   * Validates that common responses are consistent and returns the minimal set that describes the differences.
   */
  function validateCommonResponses(
    statusCode: string,
    ops: HttpOperation[]
  ): HttpOperationResponse[] {
    const statusCodeResponses: HttpOperationResponse[] = [];
    for (const op of ops) {
      for (const response of op.responses) {
        if (getOpenAPI3StatusCodes(response.statusCodes, response.type).includes(statusCode)) {
          statusCodeResponses.push(response);
        }
      }
    }
    const ref = statusCodeResponses[0];
    const sameTypeKind = statusCodeResponses.every((r) => r.type.kind === ref.type.kind);
    const sameTypeValue = statusCodeResponses.every((r) => r.type === ref.type);
    if (sameTypeKind && sameTypeValue) {
      // response is consistent and in all shared operations. Only need one copy.
      return [ref];
    } else {
      return statusCodeResponses;
    }
  }

  /**
   * Validates that common bodies are consistent and returns the minimal set that describes the differences.
   */
  function validateCommonBodies(ops: HttpOperation[]): HttpOperationRequestBody[] | undefined {
    const allBodies = ops.map((op) => op.parameters.body) as HttpOperationRequestBody[];
    return [...new Set(allBodies)];
  }

  /**
   * Validates that common parameters are consistent and returns the minimal set that describes the differences.
   */
  function validateCommonParameters(
    ops: HttpOperation[],
    name: string,
    totalOps: number
  ): HttpOperationParameter[] {
    const finalParams: HttpOperationParameter[] = [];
    const commonParams: HttpOperationParameter[] = [];
    for (const op of ops) {
      const param = op.parameters.parameters.find((p) => p.name === name);
      if (param) {
        commonParams.push(param);
      }
    }
    const reference = commonParams[0];
    if (!reference) {
      return [];
    }
    const inAllOps = ops.length === totalOps;
    const sameLocations = commonParams.every((p) => p.type === reference.type);
    const sameOptionality = commonParams.every(
      (p) => p.param.optional === reference.param.optional
    );
    const sameTypeKind = commonParams.every((p) => p.param.type.kind === reference.param.type.kind);
    const sameTypeValue = commonParams.every((p) => p.param.type === reference.param.type);

    if (inAllOps && sameLocations && sameOptionality && sameTypeKind && sameTypeValue) {
      // param is consistent and in all shared operations. Only need one copy.
      finalParams.push(reference);
    } else if (!inAllOps && sameLocations && sameOptionality && sameTypeKind && sameTypeValue) {
      // param is consistent when used, but does not appear in all shared operations. Only need one copy, but it must be optional.
      reference.param.optional = true;
      finalParams.push(reference);
    } else if (inAllOps && !(sameLocations && sameOptionality && sameTypeKind)) {
      // param is in all shared operations, but is not consistent. Need multiple copies, which must be optional.
      // exception allowed when the params only differ by their value (e.g. string enum values)
      commonParams.forEach((p) => {
        p.param.optional = true;
      });
      finalParams.push(...commonParams);
    } else {
      finalParams.push(...commonParams);
    }
    return finalParams;
  }

  interface SharedHttpOperation {
    kind: "shared";
    path: string;
    operationId: string;
    description: string | undefined;
    summary: string | undefined;
    verb: HttpVerb;
    parameters: HttpOperationParameters;
    bodies: HttpOperationRequestBody[] | undefined;
    responses: Map<string, HttpOperationResponse[]>;
    operations: Operation[];
  }

  function getOpenAPI3StatusCodes(
    statusCodes: HttpStatusCodesEntry,
    response: Type
  ): OpenAPI3StatusCode[] {
    if (isDefaultResponse(program, response) || statusCodes === "*") {
      return ["default"];
    } else if (typeof statusCodes === "number") {
      return [String(statusCodes)];
    } else {
      return rangeToOpenAPI(statusCodes, response);
    }
  }

  function rangeToOpenAPI(
    range: HttpStatusCodeRange,
    diagnosticTarget: DiagnosticTarget
  ): OpenAPI3StatusCode[] {
    const reportInvalid = () =>
      reportDiagnostic(program, {
        code: "unsupported-status-code-range",
        format: { start: String(range.start), end: String(range.end) },
        target: diagnosticTarget,
      });

    const codes: OpenAPI3StatusCode[] = [];
    let start = range.start;
    let end = range.end;

    if (range.start < 100) {
      reportInvalid();
      start = 100;
      codes.push("default");
    } else if (range.end > 599) {
      reportInvalid();
      codes.push("default");
      end = 599;
    }
    const groups = [1, 2, 3, 4, 5];

    for (const group of groups) {
      if (start > end) {
        break;
      }
      const groupStart = group * 100;
      const groupEnd = groupStart + 99;
      if (start >= groupStart && start <= groupEnd) {
        codes.push(`${group}XX`);
        if (start !== groupStart || end < groupEnd) {
          reportInvalid();
        }

        start = groupStart + 100;
      }
    }

    return codes;
  }

  function buildSharedOperations(operations: HttpOperation[]): SharedHttpOperation[] {
    const results: SharedHttpOperation[] = [];
    const paramMap = new Map<string, HttpOperation[]>();
    const responseMap = new Map<string, HttpOperation[]>();

    for (const op of operations) {
      // determine which parameters are shared by shared route operations
      for (const param of op.parameters.parameters) {
        if (paramMap.has(param.name)) {
          paramMap.get(param.name)!.push(op);
        } else {
          paramMap.set(param.name, [op]);
        }
      }
      // determine which responses are shared by shared route operations
      for (const response of op.responses) {
        const statusCodes = getOpenAPI3StatusCodes(response.statusCodes, op.operation);
        for (const statusCode of statusCodes) {
          if (responseMap.has(statusCode)) {
            responseMap.get(statusCode)!.push(op);
          } else {
            responseMap.set(statusCode, [op]);
          }
        }
      }
    }

    const totalOps = operations.length;
    const shared: SharedHttpOperation = {
      kind: "shared",
      operationId: operations.map((op) => resolveOperationId(program, op.operation)).join("_"),
      description: joinOps(operations, getDoc, " "),
      summary: joinOps(operations, getSummary, " "),
      path: operations[0].path,
      verb: operations[0].verb,
      operations: operations.map((op) => op.operation),
      parameters: {
        parameters: [],
      },
      bodies: undefined,
      responses: new Map<string, HttpOperationResponse[]>(),
    };
    for (const [paramName, ops] of paramMap) {
      const commonParams = validateCommonParameters(ops, paramName, totalOps);
      shared.parameters.parameters.push(...commonParams);
    }
    shared.bodies = validateCommonBodies(operations);
    for (const [statusCode, ops] of responseMap) {
      shared.responses.set(statusCode, validateCommonResponses(statusCode, ops));
    }
    results.push(shared);
    return results;
  }

  /**
   * Groups HttpOperations together if they share the same route.
   */
  function resolveOperations(operations: HttpOperation[]): (HttpOperation | SharedHttpOperation)[] {
    const result: (HttpOperation | SharedHttpOperation)[] = [];
    const pathMap = new Map<string, HttpOperation[]>();
    operations.forEach((op) => {
      // we don't emit overloads anyhow so emit them from grouping
      if (op.overloading !== undefined && isOverloadSameEndpoint(op as any)) {
        return;
      }
      const opKey = `${op.verb}|${op.path}`;
      pathMap.has(opKey) ? pathMap.get(opKey)!.push(op) : pathMap.set(opKey, [op]);
    });

    // now push either the singular HttpOperations or the constructed SharedHttpOperations
    for (const [_, ops] of pathMap) {
      if (ops.length === 1) {
        result.push(ops[0]);
      } else {
        const sharedOps = buildSharedOperations(ops);
        for (const op of sharedOps) {
          result.push(op);
        }
      }
    }
    return result;
  }

  async function emitOpenAPIFromVersion(
    service: Service,
    multipleService: boolean,
    version?: string
  ) {
    initializeEmitter(service, version);
    try {
      const httpService = ignoreDiagnostics(getHttpService(program, service.type));
      reportIfNoRoutes(program, httpService.operations);

      for (const op of resolveOperations(httpService.operations)) {
        if ((op as SharedHttpOperation).kind === "shared") {
          emitSharedOperation(op as SharedHttpOperation);
        } else {
          emitOperation(op as HttpOperation);
        }
      }
      emitParameters();
      emitSchemas(service.type);
      emitTags();

      // Clean up empty entries
      if (root.components) {
        for (const elem of Object.keys(root.components)) {
          if (Object.keys(root.components[elem as any]).length === 0) {
            delete root.components[elem as any];
          }
        }
      }

      if (!program.compilerOptions.noEmit && !program.hasError()) {
        // Write out the OpenAPI document to the output path

        await emitFile(program, {
          path: resolveOutputFile(service, multipleService, version),
          content: serializeDocument(root, options.fileType),
          newLine: options.newLine,
        });
      }
    } catch (err) {
      if (err instanceof ErrorTypeFoundError) {
        // Return early, there must be a parse error if an ErrorType was
        // inserted into the TypeSpec output
        return;
      } else {
        throw err;
      }
    }
  }

  function joinOps(
    operations: HttpOperation[],
    func: (program: Program, type: Type) => string | undefined,
    joinChar: string
  ): string | undefined {
    const values = operations
      .map((op) => func(program, op.operation))
      .filter((op) => op !== undefined) as string[];
    if (values.length) {
      return values.join(joinChar);
    } else {
      return undefined;
    }
  }

  function emitSharedOperation(shared: SharedHttpOperation): void {
    const { path: fullPath, verb: verb, operations: ops } = shared;
    if (!root.paths[fullPath]) {
      root.paths[fullPath] = {};
    }
    currentPath = root.paths[fullPath];
    if (!currentPath[verb]) {
      currentPath[verb] = {};
    }
    currentEndpoint = currentPath[verb];
    for (const op of ops) {
      const opTags = getAllTags(program, op);
      if (opTags) {
        const currentTags = currentEndpoint.tags;
        if (currentTags) {
          // combine tags but eliminate duplicates
          currentEndpoint.tags = [...new Set([...currentTags, ...opTags])];
        } else {
          currentEndpoint.tags = opTags;
        }
        for (const tag of opTags) {
          // Add to root tags if not already there
          tags.add(tag);
        }
      }
    }
    // Set up basic endpoint fields
    currentEndpoint.operationId = shared.operationId;
    for (const op of ops) {
      applyExternalDocs(op, currentEndpoint);
    }
    currentEndpoint.summary = shared.summary;
    currentEndpoint.description = shared.description;
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};
    // Error out if shared routes do not have consistent `@parameterVisibility`. We can
    // lift this restriction in the future if a use case develops.
    const visibilities = shared.operations.map((op) => {
      return resolveRequestVisibility(program, op, verb);
    });
    if (visibilities.some((v) => v !== visibilities[0])) {
      reportDiagnostic(program, {
        code: "inconsistent-shared-route-request-visibility",
        target: ops[0],
      });
    }
    const visibility = resolveRequestVisibility(program, shared.operations[0], verb);
    emitEndpointParameters(shared.parameters.parameters, visibility);
    if (shared.bodies) {
      if (shared.bodies.length === 1) {
        emitRequestBody(shared.bodies[0], visibility);
      } else if (shared.bodies.length > 1) {
        emitMergedRequestBody(shared.bodies, visibility);
      }
    }
    emitSharedResponses(shared.responses);
    for (const op of ops) {
      if (isDeprecated(program, op)) {
        currentEndpoint.deprecated = true;
      }
      attachExtensions(program, op, currentEndpoint);
    }
  }

  function emitOperation(operation: HttpOperation): void {
    const { path: fullPath, operation: op, verb, parameters } = operation;
    // If path contains a query string, issue msg and don't emit this endpoint
    if (fullPath.indexOf("?") > 0) {
      reportDiagnostic(program, { code: "path-query", target: op });
      return;
    }
    if (!root.paths[fullPath]) {
      root.paths[fullPath] = {};
    }
    currentPath = root.paths[fullPath];
    if (!currentPath[verb]) {
      currentPath[verb] = {};
    }
    currentEndpoint = currentPath[verb];
    const currentTags = getAllTags(program, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }
    currentEndpoint.operationId = resolveOperationId(program, operation.operation);
    applyExternalDocs(op, currentEndpoint);
    // Set up basic endpoint fields
    currentEndpoint.summary = getSummary(program, operation.operation);
    currentEndpoint.description = getDoc(program, operation.operation);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};
    const visibility = resolveRequestVisibility(program, operation.operation, verb);
    emitEndpointParameters(parameters.parameters, visibility);
    emitRequestBody(parameters.body, visibility);
    emitResponses(operation.responses);
    if (isDeprecated(program, op)) {
      currentEndpoint.deprecated = true;
    }
    attachExtensions(program, op, currentEndpoint);
  }

  function emitSharedResponses(responses: Map<string, HttpOperationResponse[]>) {
    for (const [statusCode, statusCodeResponses] of responses) {
      if (statusCodeResponses.length === 1) {
        emitResponseObject(statusCode, statusCodeResponses[0]);
      } else {
        emitMergedResponseObject(statusCode, statusCodeResponses);
      }
    }
  }

  function emitResponses(responses: HttpOperationResponse[]) {
    for (const response of responses) {
      for (const statusCode of getOpenAPI3StatusCodes(response.statusCodes, response.type)) {
        emitResponseObject(statusCode, response);
      }
    }
  }

  function isBinaryPayload(body: Type, contentType: string) {
    return (
      body.kind === "Scalar" &&
      body.name === "bytes" &&
      contentType !== "application/json" &&
      contentType !== "text/plain"
    );
  }

  function emitMergedResponseObject(
    statusCode: OpenAPI3StatusCode,
    responses: HttpOperationResponse[]
  ) {
    const openApiResponse: any = {
      description: undefined,
      content: {},
    };
    const schemaMap = new Map<string, any[]>();
    for (const response of responses) {
      if (response.description && response.description !== openApiResponse.description) {
        openApiResponse.description = openApiResponse.description
          ? `${openApiResponse.description} ${response.description}`
          : response.description;
      }
      emitResponseHeaders(openApiResponse, response.responses, response.type);
      emitResponseContent(openApiResponse, response.responses, schemaMap);
      if (!openApiResponse.description) {
        openApiResponse.description = getResponseDescriptionForStatusCode(statusCode);
      }
      currentEndpoint.responses[statusCode] = openApiResponse;
    }
  }

  function emitResponseObject(
    statusCode: OpenAPI3StatusCode,
    response: Readonly<HttpOperationResponse>
  ) {
    const openApiResponse = currentEndpoint.responses[statusCode] ?? {
      description: response.description ?? getResponseDescriptionForStatusCode(statusCode),
    };
    emitResponseHeaders(openApiResponse, response.responses, response.type);
    emitResponseContent(openApiResponse, response.responses);
    currentEndpoint.responses[statusCode] = openApiResponse;
  }

  function emitResponseHeaders(obj: any, responses: HttpOperationResponseContent[], target: Type) {
    for (const data of responses) {
      if (data.headers && Object.keys(data.headers).length > 0) {
        obj.headers ??= {};
        // OpenAPI can't represent different headers per content type.
        // So we merge headers here, and report any duplicates unless they are identical
        for (const [key, value] of Object.entries(data.headers)) {
          const headerVal = getResponseHeader(value);
          const existing = obj.headers[key];
          if (existing) {
            if (!deepEquals(existing, headerVal)) {
              reportDiagnostic(program, {
                code: "duplicate-header",
                format: { header: key },
                target: target,
              });
            }
            continue;
          }
          obj.headers[key] = headerVal;
        }
      }
    }
  }

  function emitResponseContent(
    obj: any,
    responses: HttpOperationResponseContent[],
    schemaMap: Map<string, any[]> | undefined = undefined
  ) {
    schemaMap ??= new Map<string, any[]>();
    for (const data of responses) {
      if (data.body === undefined) {
        continue;
      }
      obj.content ??= {};
      for (const contentType of data.body.contentTypes) {
        const isBinary = isBinaryPayload(data.body.type, contentType);
        const schema = isBinary
          ? { type: "string", format: "binary" }
          : getSchemaOrRef(data.body.type, Visibility.Read);
        if (schemaMap.has(contentType)) {
          schemaMap.get(contentType)!.push(schema);
        } else {
          schemaMap.set(contentType, [schema]);
        }
      }
      for (const [contentType, schema] of schemaMap) {
        if (schema.length === 1) {
          obj.content[contentType] = { schema: schema[0] };
        } else {
          obj.content[contentType] = {
            schema: { anyOf: schema },
          };
        }
      }
    }
  }

  function getResponseDescriptionForStatusCode(statusCode: string) {
    if (statusCode === "default") {
      return "An unexpected error response.";
    }
    return getStatusCodeDescription(statusCode) ?? "unknown";
  }

  function getResponseHeader(prop: ModelProperty): OpenAPI3Header | undefined {
    return getOpenAPIParameterBase(prop, Visibility.Read);
  }

  function callSchemaEmitter(type: Type, visibility: Visibility): Refable<OpenAPI3Schema> {
    const result = emitTypeWithSchemaEmitter(type, visibility);

    switch (result.kind) {
      case "code":
        return result.value as any;
      case "declaration":
        return { $ref: `#/components/schemas/${result.name}` };
      case "circular":
        reportDiagnostic(program, {
          code: "inline-cycle",
          format: { type: getOpenAPITypeName(program, type, typeNameOptions) },
          target: type,
        });
        return {};
      case "none":
        return {};
    }
  }

  function getSchemaValue(type: Type, visibility: Visibility): OpenAPI3Schema {
    const result = emitTypeWithSchemaEmitter(type, visibility);

    switch (result.kind) {
      case "code":
      case "declaration":
        return result.value as any;
      case "circular":
        reportDiagnostic(program, {
          code: "inline-cycle",
          format: { type: getOpenAPITypeName(program, type, typeNameOptions) },
          target: type,
        });
        return {};
      case "none":
        return {};
    }
  }

  function emitTypeWithSchemaEmitter(
    type: Type,
    visibility: Visibility
  ): EmitEntity<OpenAPI3Schema> {
    return schemaEmitter.emitType(type, {
      referenceContext: { visibility, serviceNamespaceName: serviceNamespace },
    }) as any;
  }

  function getSchemaOrRef(type: Type, visibility: Visibility): any {
    if (
      (type.kind === "Scalar" && program.checker.isStdType(type)) ||
      type.kind === "String" ||
      type.kind === "Number" ||
      type.kind === "Boolean" ||
      (type.kind === "Intrinsic" && type.name === "unknown") ||
      type.kind === "EnumMember" ||
      type.kind === "ModelProperty"
    ) {
      // Those types should just be inlined.
      return callSchemaEmitter(type, visibility);
    }

    type = metadataInfo.getEffectivePayloadType(type, visibility);

    const name = getOpenAPITypeName(program, type, typeNameOptions);
    if (shouldInline(program, type)) {
      const schema = getSchemaForInlineType(type, visibility, name);

      if (schema === undefined && isErrorType(type)) {
        // Exit early so that syntax errors are exposed.  This error will
        // be caught and handled in emitOpenAPI.
        throw new ErrorTypeFoundError();
      }

      // helps to read output and correlate to TypeSpec
      return schema;
    } else {
      // Use shared schema when type is not transformed by visibility from the canonical read visibility.
      if (!metadataInfo.isTransformed(type, visibility)) {
        visibility = Visibility.Read;
      }

      return callSchemaEmitter(type, visibility);
    }
  }

  function getSchemaForInlineType(type: Type, visibility: Visibility, name: string) {
    if (inProgressInlineTypes.has(type)) {
      reportDiagnostic(program, {
        code: "inline-cycle",
        format: { type: name },
        target: type,
      });
      return {};
    }
    inProgressInlineTypes.add(type);
    const schema = getSchemaForType(type, visibility);
    inProgressInlineTypes.delete(type);
    return schema;
  }

  function getParamPlaceholder(property: ModelProperty) {
    let spreadParam = false;

    if (property.sourceProperty) {
      // chase our sources all the way back to the first place this property
      // was defined.
      spreadParam = true;
      property = property.sourceProperty;
      while (property.sourceProperty) {
        property = property.sourceProperty;
      }
    }

    const refUrl = getRef(program, property);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (params.has(property)) {
      return params.get(property);
    }

    const placeholder = {};

    // only parameters inherited by spreading from non-inlined type are shared in #/components/parameters
    if (spreadParam && property.model && !shouldInline(program, property.model)) {
      params.set(property, placeholder);
      paramModels.add(property.model);
    }

    return placeholder;
  }

  function emitEndpointParameters(parameters: HttpOperationParameter[], visibility: Visibility) {
    for (const httpOpParam of parameters) {
      if (params.has(httpOpParam.param)) {
        currentEndpoint.parameters.push(params.get(httpOpParam.param));
        continue;
      }
      if (httpOpParam.type === "header" && isContentTypeHeader(program, httpOpParam.param)) {
        continue;
      }
      emitParameter(httpOpParam, visibility);
    }
  }

  function emitMergedRequestBody(
    bodies: HttpOperationRequestBody[] | undefined,
    visibility: Visibility
  ) {
    if (bodies === undefined) {
      return;
    }
    const requestBody: any = {
      description: undefined,
      content: {},
    };
    const schemaMap = new Map<string, any[]>();
    for (const body of bodies) {
      const desc = body.parameter ? getDoc(program, body.parameter) : undefined;
      if (desc) {
        requestBody.description = requestBody.description
          ? `${requestBody.description} ${desc}`
          : desc;
      }
      const contentTypes = body.contentTypes.length > 0 ? body.contentTypes : ["application/json"];
      for (const contentType of contentTypes) {
        const isBinary = isBinaryPayload(body.type, contentType);
        const bodySchema = isBinary
          ? { type: "string", format: "binary" }
          : getSchemaOrRef(body.type, visibility);
        if (schemaMap.has(contentType)) {
          schemaMap.get(contentType)!.push(bodySchema);
        } else {
          schemaMap.set(contentType, [bodySchema]);
        }
      }
    }
    const content: any = {};
    for (const [contentType, schemaArray] of schemaMap) {
      if (schemaArray.length === 1) {
        content[contentType] = { schema: schemaArray[0] };
      } else {
        content[contentType] = {
          schema: { anyOf: schemaArray },
        };
      }
    }
    requestBody.content = content;
    currentEndpoint.requestBody = requestBody;
  }

  function emitRequestBody(body: HttpOperationRequestBody | undefined, visibility: Visibility) {
    if (body === undefined || isVoidType(body.type)) {
      return;
    }

    const requestBody: any = {
      description: body.parameter ? getDoc(program, body.parameter) : undefined,
      required: body.parameter ? !body.parameter.optional : true,
      content: {},
    };

    const contentTypes = body.contentTypes.length > 0 ? body.contentTypes : ["application/json"];
    for (const contentType of contentTypes) {
      const isBinary = isBinaryPayload(body.type, contentType);
      const bodySchema = isBinary
        ? { type: "string", format: "binary" }
        : getSchemaOrRef(body.type, visibility);
      const contentEntry: any = {
        schema: bodySchema,
      };
      requestBody.content[contentType] = contentEntry;
    }

    currentEndpoint.requestBody = requestBody;
  }

  function emitParameter(parameter: HttpOperationParameter, visibility: Visibility) {
    if (isNeverType(parameter.param.type)) {
      return;
    }
    const existing = currentEndpoint.parameters.find(
      (p) => p.name === parameter.name && p.in === parameter.type
    );
    if (existing) {
      populateParameter(existing, parameter, visibility);
    } else {
      const ph = getParamPlaceholder(parameter.param);
      currentEndpoint.parameters.push(ph);

      // If the parameter already has a $ref, don't bother populating it
      if (!("$ref" in ph)) {
        populateParameter(ph, parameter, visibility);
      }
    }
  }

  function getOpenAPIParameterBase(
    param: ModelProperty,
    visibility: Visibility
  ): OpenAPI3ParameterBase | undefined {
    const typeSchema = getSchemaForType(param.type, visibility);
    if (!typeSchema) {
      return undefined;
    }
    const schema = applyEncoding(param, applyIntrinsicDecorators(param, typeSchema));
    if (param.default) {
      schema.default = getDefaultValue(param.type, param.default);
    }
    // Description is already provided in the parameter itself.
    delete schema.description;

    const oaiParam: OpenAPI3ParameterBase = {
      required: !param.optional,
      description: getDoc(program, param),
      schema,
    };

    attachExtensions(program, param, oaiParam);

    return oaiParam;
  }

  function mergeOpenApiParameters(
    param: OpenAPI3Parameter,
    base: OpenAPI3ParameterBase
  ): OpenAPI3Parameter {
    if (param.schema) {
      const schema = param.schema;
      if (schema.enum && base.schema.enum) {
        schema.enum = [...new Set([...schema.enum, ...base.schema.enum])];
      }
      param.schema = schema;
    } else {
      Object.assign(param, base);
    }
    return param;
  }

  function populateParameter(
    ph: OpenAPI3Parameter,
    parameter: HttpOperationParameter,
    visibility: Visibility
  ) {
    ph.name = parameter.name;
    ph.in = parameter.type;

    const paramBase = getOpenAPIParameterBase(parameter.param, visibility);
    if (paramBase) {
      ph = mergeOpenApiParameters(ph, paramBase);
    }

    const format = mapParameterFormat(parameter);
    if (format === undefined) {
      ph.schema = {
        type: "string",
      };
    } else {
      Object.assign(ph, format);
    }
  }

  function mapParameterFormat(
    parameter: HttpOperationParameter
  ): { style?: string; explode?: boolean } | undefined {
    switch (parameter.type) {
      case "header":
        return mapHeaderParameterFormat(parameter);
      case "query":
        return mapQueryParameterFormat(parameter);
      case "path":
        return {};
    }
  }

  function mapHeaderParameterFormat(
    parameter: HeaderFieldOptions & {
      param: ModelProperty;
    }
  ): { style?: string; explode?: boolean } | undefined {
    switch (parameter.format) {
      case undefined:
        return {};
      case "csv":
      case "simple":
        return { style: "simple" };
      default:
        reportDiagnostic(program, {
          code: "invalid-format",
          format: {
            paramType: "header",
            value: parameter.format,
          },
          target: parameter.param,
        });
        return undefined;
    }
  }
  function mapQueryParameterFormat(
    parameter: QueryParameterOptions & {
      param: ModelProperty;
    }
  ): { style?: string; explode?: boolean } | undefined {
    switch (parameter.format) {
      case undefined:
        return {};
      case "csv":
      case "simple":
        return { style: "form", explode: false };
      case "multi":
      case "form":
        return { style: "form", explode: true };
      case "ssv":
        return { style: "spaceDelimited", explode: false };
      case "pipes":
        return { style: "pipeDelimited", explode: false };

      default:
        reportDiagnostic(program, {
          code: "invalid-format",
          format: {
            paramType: "query",
            value: parameter.format,
          },
          target: parameter.param,
        });
        return undefined;
    }
  }

  function emitParameters() {
    for (const [property, param] of params) {
      const key = getParameterKey(
        program,
        property,
        param,
        root.components!.parameters!,
        typeNameOptions
      );

      root.components!.parameters![key] = { ...param };
      for (const key of Object.keys(param)) {
        delete param[key];
      }

      param.$ref = "#/components/parameters/" + encodeURIComponent(key);
    }
  }

  function emitSchemas(serviceNamespace: Namespace) {
    if (!options.omitUnreachableTypes) {
      processUnreferencedSchemas();
    }

    const files = schemaEmitter.getSourceFiles();
    if (files.length > 0) {
      compilerAssert(
        files.length === 1,
        `Should only have a single file for now but got ${files.length}`
      );
      const schemas = root.components!.schemas!;
      const declarations = files[0].globalScope.declarations;
      for (const declaration of declarations) {
        schemas[declaration.name] = declaration.value as any;
      }
    }

    function processUnreferencedSchemas() {
      const addSchema = (type: Type) => {
        if (
          visibilityUsage.getUsage(type) === undefined &&
          !paramModels.has(type) &&
          !shouldInline(program, type)
        ) {
          getSchemaOrRef(type, Visibility.Read);
        }
      };
      const skipSubNamespaces = isGlobalNamespace(program, serviceNamespace);
      navigateTypesInNamespace(
        serviceNamespace,
        {
          model: addSchema,
          scalar: addSchema,
          enum: addSchema,
          union: addSchema,
        },
        { skipSubNamespaces }
      );
    }
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags!.push({ name: tag });
    }
  }

  function getSchemaForType(type: Type, visibility: Visibility): OpenAPI3Schema | undefined {
    return callSchemaEmitter(type, visibility) as any;
  }

  function getDefaultValue(type: Type, defaultType: Type): any {
    switch (defaultType.kind) {
      case "String":
        return defaultType.value;
      case "Number":
        return defaultType.value;
      case "Boolean":
        return defaultType.value;
      case "Tuple":
        compilerAssert(
          type.kind === "Tuple" || (type.kind === "Model" && isArrayModelType(program, type)),
          "setting tuple default to non-tuple value"
        );

        if (type.kind === "Tuple") {
          return defaultType.values.map((defaultTupleValue, index) =>
            getDefaultValue(type.values[index], defaultTupleValue)
          );
        } else {
          return defaultType.values.map((defaultTuplevalue) =>
            getDefaultValue(type.indexer!.value, defaultTuplevalue)
          );
        }

      case "Intrinsic":
        return isNullType(defaultType)
          ? null
          : reportDiagnostic(program, {
              code: "invalid-default",
              format: { type: defaultType.kind },
              target: defaultType,
            });
      case "EnumMember":
        return defaultType.value ?? defaultType.name;
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: defaultType.kind },
          target: defaultType,
        });
    }
  }

  function attachExtensions(program: Program, type: Type, emitObject: any) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(program, type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  function applyIntrinsicDecorators(typespecType: Type, target: OpenAPI3Schema): OpenAPI3Schema {
    const newTarget = { ...target };
    const docStr = getDoc(program, typespecType);

    if (docStr) {
      newTarget.description = docStr;
    }
    const formatStr = getFormat(program, typespecType);
    if (formatStr) {
      newTarget.format = formatStr;
    }

    const pattern = getPattern(program, typespecType);
    if (pattern) {
      newTarget.pattern = pattern;
    }

    const minLength = getMinLength(program, typespecType);
    if (minLength !== undefined) {
      newTarget.minLength = minLength;
    }

    const maxLength = getMaxLength(program, typespecType);
    if (maxLength !== undefined) {
      newTarget.maxLength = maxLength;
    }

    const minValue = getMinValue(program, typespecType);
    if (minValue !== undefined) {
      newTarget.minimum = minValue;
    }

    const minValueExclusive = getMinValueExclusive(program, typespecType);
    if (minValueExclusive !== undefined) {
      newTarget.minimum = minValueExclusive;
      newTarget.exclusiveMinimum = true;
    }

    const maxValue = getMaxValue(program, typespecType);
    if (maxValue !== undefined) {
      newTarget.maximum = maxValue;
    }

    const maxValueExclusive = getMaxValueExclusive(program, typespecType);
    if (maxValueExclusive !== undefined) {
      newTarget.maximum = maxValueExclusive;
      newTarget.exclusiveMaximum = true;
    }

    const minItems = getMinItems(program, typespecType);
    if (!target.minItems && minItems !== undefined) {
      newTarget.minItems = minItems;
    }

    const maxItems = getMaxItems(program, typespecType);
    if (!target.maxItems && maxItems !== undefined) {
      newTarget.maxItems = maxItems;
    }

    if (isSecret(program, typespecType)) {
      newTarget.format = "password";
    }

    const title = getSummary(program, typespecType);
    if (title) {
      newTarget.title = title;
    }

    const values = getKnownValues(program, typespecType as any);
    if (values) {
      return {
        oneOf: [newTarget, callSchemaEmitter(values, Visibility.Read)],
      };
    }

    attachExtensions(program, typespecType, newTarget);

    return newTarget;
  }

  function applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: OpenAPI3Schema
  ): OpenAPI3Schema {
    const encodeData = getEncode(program, typespecType);
    if (encodeData) {
      const newTarget = { ...target };
      const newType = callSchemaEmitter(encodeData.type, Visibility.Read) as OpenAPI3Schema;
      newTarget.type = newType.type;
      // If the target already has a format it takes priority. (e.g. int32)
      newTarget.format = mergeFormatAndEncoding(
        newTarget.format,
        encodeData.encoding,
        newType.format
      );
      return newTarget;
    }
    return target;
  }
  function mergeFormatAndEncoding(
    format: string | undefined,
    encoding: string,
    encodeAsFormat: string | undefined
  ): string {
    switch (format) {
      case undefined:
        return encodeAsFormat ?? encoding;
      case "date-time":
        switch (encoding) {
          case "rfc3339":
            return "date-time";
          case "unixTimestamp":
            return "unixtime";
          case "rfc7231":
            return "http-date";
          default:
            return encoding;
        }
      case "duration":
        switch (encoding) {
          case "ISO8601":
            return "duration";
          default:
            return encodeAsFormat ?? encoding;
        }
      default:
        return encodeAsFormat ?? encoding;
    }
  }

  function applyExternalDocs(typespecType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(program, typespecType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  function processAuth(serviceNamespace: Namespace):
    | {
        securitySchemes: Record<string, OpenAPI3SecurityScheme>;
        security: Record<string, string[]>[];
      }
    | undefined {
    const authentication = getAuthentication(program, serviceNamespace);
    if (authentication) {
      return processServiceAuthentication(authentication);
    }
    return undefined;
  }

  function processServiceAuthentication(authentication: ServiceAuthentication): {
    securitySchemes: Record<string, OpenAPI3SecurityScheme>;
    security: Record<string, string[]>[];
  } {
    const oaiSchemes: Record<string, OpenAPI3SecurityScheme> = {};
    const security: Record<string, string[]>[] = [];
    for (const option of authentication.options) {
      const oai3SecurityOption: Record<string, string[]> = {};
      for (const scheme of option.schemes) {
        const [oaiScheme, scopes] = getOpenAPI3Scheme(scheme);
        oaiSchemes[scheme.id] = oaiScheme;
        oai3SecurityOption[scheme.id] = scopes;
      }
      security.push(oai3SecurityOption);
    }
    return { securitySchemes: oaiSchemes, security };
  }

  function getOpenAPI3Scheme(auth: HttpAuth): [OpenAPI3SecurityScheme, string[]] {
    switch (auth.type) {
      case "http":
        return [{ type: "http", scheme: auth.scheme, description: auth.description }, []];
      case "apiKey":
        return [
          { type: "apiKey", in: auth.in, name: auth.name, description: auth.description },
          [],
        ];
      case "oauth2":
        const flows: OpenAPI3OAuthFlows = {};
        const scopes: string[] = [];
        for (const flow of auth.flows) {
          scopes.push(...flow.scopes.map((x) => x.value));
          flows[flow.type] = {
            authorizationUrl: (flow as any).authorizationUrl,
            tokenUrl: (flow as any).tokenUrl,
            refreshUrl: flow.refreshUrl,
            scopes: Object.fromEntries(flow.scopes.map((x) => [x.value, x.description ?? ""])),
          };
        }
        return [{ type: "oauth2", flows, description: auth.description }, scopes];
      default:
        const _assertNever: never = auth;
        compilerAssert(false, "Unreachable");
    }
  }
}

function serializeDocument(root: OpenAPI3Document, fileType: FileType): string {
  sortOpenAPIDocument(root);
  switch (fileType) {
    case "json":
      return prettierOutput(JSON.stringify(root, null, 2));
    case "yaml":
      return stringify(root, {
        singleQuote: true,
        aliasDuplicateObjects: false,
        lineWidth: 0,
      });
  }
}

function prettierOutput(output: string) {
  return output + "\n";
}

class ErrorTypeFoundError extends Error {
  constructor() {
    super("Error type found in evaluated TypeSpec output");
  }
}

function sortObjectByKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((sortedObj: any, key: string) => {
      sortedObj[key] = obj[key];
      return sortedObj;
    }, {});
}

function sortOpenAPIDocument(doc: OpenAPI3Document): void {
  doc.paths = sortObjectByKeys(doc.paths);
  if (doc.components?.schemas) {
    doc.components.schemas = sortObjectByKeys(doc.components.schemas);
  }
  if (doc.components?.parameters) {
    doc.components.parameters = sortObjectByKeys(doc.components.parameters);
  }
}
