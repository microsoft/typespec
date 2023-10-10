import {
  BooleanLiteral,
  compilerAssert,
  DiagnosticTarget,
  DiscriminatedUnion,
  EmitContext,
  emitFile,
  Enum,
  EnumMember,
  getAllTags,
  getAnyExtensionFromPath,
  getDiscriminatedUnion,
  getDiscriminator,
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
  IntrinsicScalarName,
  IntrinsicType,
  isArrayModelType,
  isDeprecated,
  isErrorType,
  isGlobalNamespace,
  isNeverType,
  isNullType,
  isRecordModelType,
  isSecret,
  isTemplateDeclaration,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  navigateTypesInNamespace,
  NewLine,
  NumericLiteral,
  Operation,
  Program,
  ProjectionApplication,
  projectProgram,
  resolvePath,
  Scalar,
  Service,
  StringLiteral,
  TwoLevelMap,
  Type,
  TypeNameOptions,
  Union,
  UnionVariant,
} from "@typespec/compiler";

import {
  createMetadataInfo,
  getAuthentication,
  getHttpService,
  getServers,
  getStatusCodeDescription,
  getVisibilitySuffix,
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
  checkDuplicateTypeName,
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
import { getOneOf, getRef } from "./decorators.js";
import { FileType, OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import {
  OpenAPI3Discriminator,
  OpenAPI3Document,
  OpenAPI3Header,
  OpenAPI3OAuthFlows,
  OpenAPI3Operation,
  OpenAPI3Parameter,
  OpenAPI3ParameterBase,
  OpenAPI3Schema,
  OpenAPI3SchemaProperty,
  OpenAPI3SecurityScheme,
  OpenAPI3Server,
  OpenAPI3ServerVariable,
  OpenAPI3StatusCode,
} from "./types.js";

const defaultFileType: FileType = "yaml";
const defaultOptions = {
  "new-line": "lf",
  "omit-unreachable-types": false,
  "include-x-typespec-name": "never",
} as const;

export async function $onEmit(context: EmitContext<OpenAPI3EmitterOptions>) {
  const options = resolveOptions(context);
  const emitter = createOAPIEmitter(context.program, options);
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

/**
 * Represents a node that will hold a JSON reference. The value is computed
 * at the end so that we can defer decisions about the name that is
 * referenced.
 */
class Ref {
  value?: string;
  toJSON() {
    compilerAssert(this.value, "Reference value never set.");
    return this.value;
  }
}

/**
 * Represents a non-inlined schema that will be emitted as a definition.
 * Computation of the OpenAPI schema object is deferred.
 */
interface PendingSchema {
  /** The TYPESPEC type for the schema */
  type: Type;

  /** The visibility to apply when computing the schema */
  visibility: Visibility;

  /**
   * The JSON reference to use to point to this schema.
   *
   * Note that its value will not be computed until all schemas have been
   * computed as we will add a suffix to the name if more than one schema
   * must be emitted for the type for different visibilities.
   */
  ref: Ref;
}

/**
 * Represents a schema that is ready to emit as its OpenAPI representation
 * has been produced.
 */
interface ProcessedSchema extends PendingSchema {
  schema: OpenAPI3Schema | undefined;
}

function createOAPIEmitter(program: Program, options: ResolvedOpenAPI3EmitterOptions) {
  let root: OpenAPI3Document;

  // Get the service namespace string for use in name shortening
  let serviceNamespace: string | undefined;
  let currentPath: any;
  let currentEndpoint: OpenAPI3Operation;

  let metadataInfo: MetadataInfo;

  // Keep a map of all Types+Visibility combinations that were encountered
  // that need schema definitions.
  let pendingSchemas = new TwoLevelMap<Type, Visibility, PendingSchema>();

  // Reuse a single ref object per Type+Visibility combination.
  let refs = new TwoLevelMap<Type, Visibility, Ref>();

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
    pendingSchemas = new TwoLevelMap();
    refs = new TwoLevelMap();
    metadataInfo = createMetadataInfo(program, {
      canonicalVisibility: Visibility.Read,
      canShareProperty: (p) => isReadonlyProperty(program, p),
    });
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
          variable.enum = getSchemaForEnum(prop.type).enum;
        } else if (prop.type.kind === "Union") {
          variable.enum = getSchemaForUnion(prop.type, Visibility.Read).enum as any;
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
  function validateCommonResponses(ops: HttpOperation[]): HttpOperationResponse[] {
    const statusCodeResponses: HttpOperationResponse[] = [];
    for (const op of ops) {
      for (const response of op.responses) {
        statusCodeResponses.push(response);
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
      shared.responses.set(statusCode, validateCommonResponses(ops));
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
        // So we merge headers here, and report any duplicates.
        // It may be possible in principle to not error for identically declared
        // headers.
        for (const [key, value] of Object.entries(data.headers)) {
          if (obj.headers[key]) {
            reportDiagnostic(program, {
              code: "duplicate-header",
              format: { header: key },
              target: target,
            });
            continue;
          }
          obj.headers[key] = getResponseHeader(value);
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

  function getSchemaOrRef(type: Type, visibility: Visibility): any {
    const refUrl = getRef(program, type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (type.kind === "Scalar" && program.checker.isStdType(type)) {
      return getSchemaForScalar(type);
    }

    if (type.kind === "String" || type.kind === "Number" || type.kind === "Boolean") {
      // For literal types, we just want to emit them directly as well.
      return getSchemaForLiterals(type);
    }

    if (type.kind === "Intrinsic" && type.name === "unknown") {
      return getSchemaForIntrinsicType(type);
    }

    if (type.kind === "EnumMember") {
      // Enum members are just the OA representation of their values.
      if (typeof type.value === "number") {
        return { type: "number", enum: [type.value] };
      } else {
        return { type: "string", enum: [type.value ?? type.name] };
      }
    }

    if (type.kind === "ModelProperty") {
      return resolveProperty(type, visibility);
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
      if (schema && options.includeXTypeSpecName !== "never") {
        schema["x-typespec-name"] = name;
      }
      return schema;
    } else {
      // Use shared schema when type is not transformed by visibility from the canonical read visibility.
      if (!metadataInfo.isTransformed(type, visibility)) {
        visibility = Visibility.Read;
      }
      const pending = pendingSchemas.getOrAdd(type, visibility, () => ({
        type,
        visibility,
        ref: refs.getOrAdd(type, visibility, () => new Ref()),
      }));
      return {
        $ref: pending.ref,
      };
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
    if (body === undefined) {
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
    const processedSchemas = new TwoLevelMap<Type, Visibility, ProcessedSchema>();

    processSchemas();
    if (!options.omitUnreachableTypes) {
      processUnreferencedSchemas();
    }

    // Emit the processed schemas. Only now can we compute the names as it
    // depends on whether we have produced multiple schemas for a single
    // TYPESPEC type.
    for (const group of processedSchemas.values()) {
      for (const [visibility, processed] of group) {
        let name = getOpenAPITypeName(program, processed.type, typeNameOptions);
        if (group.size > 1) {
          name += getVisibilitySuffix(visibility, Visibility.Read);
        }
        checkDuplicateTypeName(program, processed.type, name, root.components!.schemas);
        processed.ref.value = "#/components/schemas/" + encodeURIComponent(name);
        if (processed.schema) {
          root.components!.schemas![name] = processed.schema;
        }
      }
    }

    function processSchemas() {
      // Process pending schemas. Note that getSchemaForType may pull in new
      // pending schemas so we iterate until there are no pending schemas
      // remaining.
      while (pendingSchemas.size > 0) {
        for (const [type, group] of pendingSchemas) {
          for (const [visibility, pending] of group) {
            processedSchemas.getOrAdd(type, visibility, () => ({
              ...pending,
              schema: getSchemaForType(type, visibility),
            }));
          }
          pendingSchemas.delete(type);
        }
      }
    }

    function processUnreferencedSchemas() {
      const addSchema = (type: Type) => {
        if (!processedSchemas.has(type) && !paramModels.has(type) && !shouldInline(program, type)) {
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
      processSchemas();
    }
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags!.push({ name: tag });
    }
  }

  function getSchemaForType(type: Type, visibility: Visibility): OpenAPI3Schema | undefined {
    const builtinType = getSchemaForLiterals(type);
    if (builtinType !== undefined) return builtinType;

    switch (type.kind) {
      case "Intrinsic":
        return getSchemaForIntrinsicType(type);
      case "Model":
        return getSchemaForModel(type, visibility);
      case "ModelProperty":
        return getSchemaForType(type.type, visibility);
      case "Scalar":
        return getSchemaForScalar(type);
      case "Union":
        return getSchemaForUnion(type, visibility);
      case "UnionVariant":
        return getSchemaForUnionVariant(type, visibility);
      case "Enum":
        return getSchemaForEnum(type);
      case "Tuple":
        return { type: "array", items: {} };
      case "TemplateParameter":
        // Note: This should never happen if it does there is a bug in the compiler.
        reportDiagnostic(program, {
          code: "invalid-schema",
          format: { type: `${type.node.id.sv} (template parameter)` },
          target: type,
        });
        return undefined;
    }

    reportDiagnostic(program, {
      code: "invalid-schema",
      format: { type: type.kind },
      target: type,
    });
    return undefined;
  }

  function getSchemaForIntrinsicType(type: IntrinsicType): OpenAPI3Schema {
    switch (type.name) {
      case "unknown":
        return {};
    }

    reportDiagnostic(program, {
      code: "invalid-schema",
      format: { type: type.name },
      target: type,
    });
    return {};
  }

  function getSchemaForEnum(e: Enum) {
    const values = [];
    if (e.members.size === 0) {
      reportDiagnostic(program, { code: "empty-enum", target: e });

      return {};
    }
    const type = enumMemberType(e.members.values().next().value);
    for (const option of e.members.values()) {
      if (type !== enumMemberType(option)) {
        reportDiagnostic(program, { code: "enum-unique-type", target: e });
        continue;
      }

      values.push(option.value ?? option.name);
    }

    const schema: any = { type, description: getDoc(program, e) };
    if (values.length > 0) {
      schema.enum = values;
    }

    return schema;
    function enumMemberType(member: EnumMember) {
      if (typeof member.value === "number") {
        return "number";
      }
      return "string";
    }
  }

  /**
   * A TypeSpec union maps to a variety of OA3 structures according to the following rules:
   *
   * * A union containing `null` makes a `nullable` schema comprised of the remaining
   *   union variants.
   * * A union containing literal types are converted to OA3 enums. All literals of the
   *   same type are combined into single enums.
   * * A union that contains multiple items (after removing null and combining like-typed
   *   literals into enums) is an `anyOf` union unless `oneOf` is applied to the union
   *   declaration.
   */
  function getSchemaForUnion(union: Union, visibility: Visibility): OpenAPI3Schema {
    if (union.variants.size === 0) {
      reportDiagnostic(program, { code: "empty-union", target: union });
      return {};
    }
    const variants = Array.from(union.variants.values());
    const literalVariantEnumByType: Record<string, any> = {};
    const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
    const schemaMembers: { schema: any; type: Type | null }[] = [];
    let nullable = false;
    const discriminator = getDiscriminator(program, union);

    for (const variant of variants) {
      if (isNullType(variant.type)) {
        nullable = true;
        continue;
      }

      if (isLiteralType(variant.type)) {
        if (!literalVariantEnumByType[variant.type.kind]) {
          const enumSchema = getSchemaForLiterals(variant.type);
          literalVariantEnumByType[variant.type.kind] = enumSchema;
          schemaMembers.push({ schema: enumSchema, type: null });
        } else {
          literalVariantEnumByType[variant.type.kind].enum.push(variant.type.value);
        }
        continue;
      }

      schemaMembers.push({ schema: getSchemaOrRef(variant.type, visibility), type: variant.type });
    }

    if (schemaMembers.length === 0) {
      if (nullable) {
        // This union is equivalent to just `null` but OA3 has no way to specify
        // null as a value, so we throw an error.
        reportDiagnostic(program, { code: "union-null", target: union });
        return {};
      } else {
        // completely empty union can maybe only happen with bugs?
        compilerAssert(false, "Attempting to emit an empty union");
      }
    }

    if (schemaMembers.length === 1) {
      // we can just return the single schema member after applying nullable
      const schema = schemaMembers[0].schema;
      const type = schemaMembers[0].type;

      if (nullable) {
        if (schema.$ref) {
          // but we can't make a ref "nullable", so wrap in an allOf (for models)
          // or oneOf (for all other types)
          if (type && type.kind === "Model") {
            return { type: "object", allOf: [schema], nullable: true };
          } else {
            return { oneOf: [schema], nullable: true };
          }
        } else {
          schema.nullable = true;
        }
      }

      return schema;
    }

    const schema: any = {
      [ofType]: schemaMembers.map((m) => m.schema),
    };

    if (nullable) {
      schema.nullable = true;
    }

    if (discriminator) {
      // the decorator validates that all the variants will be a model type
      // with the discriminator field present.
      schema.discriminator = { ...discriminator };
      // Diagnostic already reported in compiler for unions
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(union, discriminator));
      if (discriminatedUnion.variants.size > 0) {
        schema.discriminator.mapping = getDiscriminatorMapping(discriminatedUnion, visibility);
      }
    }

    return applyIntrinsicDecorators(union, schema);
  }

  function getSchemaForUnionVariant(variant: UnionVariant, visibility: Visibility) {
    const schema: any = getSchemaForType(variant.type, visibility);
    return schema;
  }

  function isLiteralType(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral {
    return type.kind === "Boolean" || type.kind === "String" || type.kind === "Number";
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

  function includeDerivedModel(model: Model): boolean {
    return (
      !isTemplateDeclaration(model) &&
      (model.templateMapper?.args === undefined ||
        model.templateMapper.args?.length === 0 ||
        model.derivedModels.length > 0)
    );
  }

  function getSchemaForModel(model: Model, visibility: Visibility) {
    const array = getArrayType(model, visibility);
    if (array) {
      return array;
    }

    const modelSchema: OpenAPI3Schema = {
      type: "object",
      description: getDoc(program, model),
    };
    const properties: OpenAPI3Schema["properties"] = {};

    if (isRecordModelType(program, model)) {
      modelSchema.additionalProperties = getSchemaOrRef(model.indexer.value, visibility);
    }

    const derivedModels = model.derivedModels.filter(includeDerivedModel);
    // getSchemaOrRef on all children to push them into components.schemas
    for (const child of derivedModels) {
      getSchemaOrRef(child, visibility);
    }

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      const [union] = getDiscriminatedUnion(model, discriminator);

      const openApiDiscriminator: OpenAPI3Discriminator = { ...discriminator };
      if (union.variants.size > 0) {
        openApiDiscriminator.mapping = getDiscriminatorMapping(union, visibility);
      }

      modelSchema.discriminator = openApiDiscriminator;
      properties[discriminator.propertyName] = {
        type: "string",
        description: `Discriminator property for ${model.name}.`,
      };
    }

    applyExternalDocs(model, modelSchema);

    for (const [name, prop] of model.properties) {
      if (!metadataInfo.isPayloadProperty(prop, visibility)) {
        continue;
      }

      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }

      if (!metadataInfo.isOptional(prop, visibility)) {
        if (!modelSchema.required) {
          modelSchema.required = [];
        }
        modelSchema.required.push(name);
      }

      properties[name] = resolveProperty(prop, visibility);
    }

    if (model.baseModel) {
      const baseSchema = getSchemaOrRef(model.baseModel, visibility);
      modelSchema.allOf = [baseSchema];
    }

    if (Object.keys(properties).length > 0) {
      modelSchema.properties = properties;
    }
    // Attach any OpenAPI extensions
    attachExtensions(program, model, modelSchema);
    return modelSchema;
  }

  function resolveProperty(prop: ModelProperty, visibility: Visibility): OpenAPI3SchemaProperty {
    const description = getDoc(program, prop);

    const schema = applyEncoding(prop, getSchemaOrRef(prop.type, visibility));
    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<OpenAPI3Schema> = applyIntrinsicDecorators(prop, {});
    if (description) {
      additionalProps.description = description;
    }

    if (prop.default) {
      additionalProps.default = getDefaultValue(prop.type, prop.default);
    }

    if (isReadonlyProperty(program, prop)) {
      additionalProps.readOnly = true;
    }

    // Attach any additional OpenAPI extensions
    attachExtensions(program, prop, additionalProps);

    if (schema && "$ref" in schema) {
      if (Object.keys(additionalProps).length === 0) {
        return schema;
      } else {
        return {
          allOf: [schema],
          ...additionalProps,
        };
      }
    } else {
      if (getOneOf(program, prop) && schema.anyOf) {
        schema.oneOf = schema.anyOf;
        delete schema.anyOf;
      }

      return { ...schema, ...additionalProps };
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

  function getDiscriminatorMapping(union: DiscriminatedUnion, visibility: Visibility) {
    const mapping: Record<string, string> | undefined = {};
    for (const [key, model] of union.variants.entries()) {
      mapping[key] = getSchemaOrRef(model, visibility).$ref;
    }
    return mapping;
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

    const values = getKnownValues(program, typespecType as any);
    if (values) {
      return {
        oneOf: [newTarget, getSchemaForEnum(values)],
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
      const newType = getSchemaForScalar(encodeData.type);
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

  // Map an TypeSpec type to an OA schema. Returns undefined when the resulting
  // OA schema is just a regular object schema.
  function getSchemaForLiterals(
    typespecType: NumericLiteral | StringLiteral | BooleanLiteral
  ): OpenAPI3Schema;
  function getSchemaForLiterals(typespecType: Type): OpenAPI3Schema | undefined;
  function getSchemaForLiterals(typespecType: Type): OpenAPI3Schema | undefined {
    switch (typespecType.kind) {
      case "Number":
        return { type: "number", enum: [typespecType.value] };
      case "String":
        return { type: "string", enum: [typespecType.value] };
      case "Boolean":
        return { type: "boolean", enum: [typespecType.value] };
      default:
        return undefined;
    }
  }

  /**
   * Map TypeSpec intrinsic models to open api definitions
   */
  function getArrayType(typespecType: Model, visibility: Visibility): OpenAPI3Schema | undefined {
    if (isArrayModelType(program, typespecType)) {
      const array: OpenAPI3Schema = {
        type: "array",
        items: getSchemaOrRef(typespecType.indexer.value!, visibility | Visibility.Item),
      };
      return applyIntrinsicDecorators(typespecType, array);
    }
    return undefined;
  }

  function getSchemaForScalar(scalar: Scalar): OpenAPI3Schema {
    let result: OpenAPI3Schema = {};
    const isStd = program.checker.isStdType(scalar);
    if (isStd) {
      result = getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = getSchemaForScalar(scalar.baseScalar);
    }
    const withDecorators = applyEncoding(scalar, applyIntrinsicDecorators(scalar, result));
    if (isStd) {
      // Standard types are going to be inlined in the spec and we don't want the description of the scalar to show up
      delete withDecorators.description;
    }
    return withDecorators;
  }

  function getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPI3Schema {
    switch (scalar.name) {
      case "bytes":
        return { type: "string", format: "byte" };
      case "numeric":
        return { type: "number" };
      case "integer":
        return { type: "integer" };
      case "int8":
        return { type: "integer", format: "int8" };
      case "int16":
        return { type: "integer", format: "int16" };
      case "int32":
        return { type: "integer", format: "int32" };
      case "int64":
        return { type: "integer", format: "int64" };
      case "safeint":
        return { type: "integer", format: "int64" };
      case "uint8":
        return { type: "integer", format: "uint8" };
      case "uint16":
        return { type: "integer", format: "uint16" };
      case "uint32":
        return { type: "integer", format: "uint32" };
      case "uint64":
        return { type: "integer", format: "uint64" };
      case "float":
        return { type: "number" };
      case "float64":
        return { type: "number", format: "double" };
      case "float32":
        return { type: "number", format: "float" };
      case "decimal":
        return { type: "number", format: "decimal" };
      case "decimal128":
        return { type: "number", format: "decimal128" };
      case "string":
        return { type: "string" };
      case "boolean":
        return { type: "boolean" };
      case "plainDate":
        return { type: "string", format: "date" };
      case "utcDateTime":
      case "offsetDateTime":
        return { type: "string", format: "date-time" };
      case "plainTime":
        return { type: "string", format: "time" };
      case "duration":
        return { type: "string", format: "duration" };
      case "url":
        return { type: "string", format: "uri" };
      default:
        const _assertNever: never = scalar.name;
        return {};
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
      return stringify(
        root,
        (key, value) => {
          return value instanceof Ref ? value.toJSON() : value;
        },
        {
          singleQuote: true,
          aliasDuplicateObjects: false,
          lineWidth: 0,
        }
      );
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
