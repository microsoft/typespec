import {
  compilerAssert,
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  EmitContext,
  emitFile,
  Example,
  getAllTags,
  getAnyExtensionFromPath,
  getDoc,
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
  isDeprecated,
  isGlobalNamespace,
  isNeverType,
  isSecret,
  isVoidType,
  listServices,
  ModelProperty,
  Namespace,
  navigateTypesInNamespace,
  NewLine,
  Program,
  ProjectionApplication,
  projectProgram,
  resolvePath,
  Service,
  Type,
  TypeNameOptions,
} from "@typespec/compiler";

import { AssetEmitter, createAssetEmitter, EmitEntity } from "@typespec/compiler/emitter-framework";
import {} from "@typespec/compiler/utils";
import {
  AuthenticationOptionReference,
  AuthenticationReference,
  createMetadataInfo,
  getHttpService,
  getServers,
  getStatusCodeDescription,
  HeaderFieldOptions,
  HttpAuth,
  HttpOperation,
  HttpOperationBody,
  HttpOperationMultipartBody,
  HttpOperationParameter,
  HttpOperationPart,
  HttpOperationResponse,
  HttpOperationResponseContent,
  HttpServer,
  HttpServiceAuthentication,
  isContentTypeHeader,
  isOrExtendsHttpFile,
  isOverloadSameEndpoint,
  MetadataInfo,
  reportIfNoRoutes,
  resolveAuthentication,
  resolveRequestVisibility,
  Visibility,
} from "@typespec/http";
import {
  getExtensions,
  getExternalDocs,
  getOpenAPITypeName,
  getParameterKey,
  isReadonlyProperty,
  resolveInfo,
  resolveOperationId,
  shouldInline,
} from "@typespec/openapi";
import { buildVersionProjections, VersionProjections } from "@typespec/versioning";
import { stringify } from "yaml";
import { getRef } from "./decorators.js";
import { applyEncoding } from "./encoding.js";
import { getExampleOrExamples, OperationExamples, resolveOperationExamples } from "./examples.js";
import { createDiagnostic, FileType, OpenAPI3EmitterOptions } from "./lib.js";
import { getDefaultValue, isBytesKeptRaw, OpenAPI3SchemaEmitter } from "./schema-emitter.js";
import { getOpenAPI3StatusCodes } from "./status-codes.js";
import {
  OpenAPI3Document,
  OpenAPI3Encoding,
  OpenAPI3Header,
  OpenAPI3MediaType,
  OpenAPI3OAuthFlows,
  OpenAPI3Operation,
  OpenAPI3Parameter,
  OpenAPI3ParameterBase,
  OpenAPI3RequestBody,
  OpenAPI3Response,
  OpenAPI3Schema,
  OpenAPI3SecurityScheme,
  OpenAPI3Server,
  OpenAPI3ServerVariable,
  OpenAPI3ServiceRecord,
  OpenAPI3StatusCode,
  OpenAPI3VersionedServiceRecord,
  Refable,
} from "./types.js";
import { deepEquals, isSharedHttpOperation, SharedHttpOperation } from "./util.js";
import { resolveVisibilityUsage, VisibilityUsageTracker } from "./visibility-usage.js";

const defaultFileType: FileType = "yaml";
const defaultOptions = {
  "new-line": "lf",
  "omit-unreachable-types": false,
  "include-x-typespec-name": "never",
  "safeint-strategy": "int64",
} as const;

export async function $onEmit(context: EmitContext<OpenAPI3EmitterOptions>) {
  const options = resolveOptions(context);
  const emitter = createOAPIEmitter(context, options);
  await emitter.emitOpenAPI();
}

type IrrelevantOpenAPI3EmitterOptionsForObject = "file-type" | "output-file" | "new-line";

/**
 * Get the OpenAPI 3 document records from the given program. The documents are
 * returned as a JS object.
 *
 * @param program The program to emit to OpenAPI 3
 * @param options OpenAPI 3 emit options
 * @returns An array of OpenAPI 3 document records.
 */
export async function getOpenAPI3(
  program: Program,
  options: Omit<OpenAPI3EmitterOptions, IrrelevantOpenAPI3EmitterOptionsForObject> = {}
): Promise<OpenAPI3ServiceRecord[]> {
  const context: EmitContext<any> = {
    program,

    // this value doesn't matter for getting the OpenAPI3 objects
    emitterOutputDir: "tsp-output",

    options: options,
    getAssetEmitter(TypeEmitterClass) {
      return createAssetEmitter(program, TypeEmitterClass, this);
    },
  };

  const resolvedOptions = resolveOptions(context);
  const emitter = createOAPIEmitter(context, resolvedOptions);
  return emitter.getOpenAPI();
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
    safeintStrategy: resolvedOptions["safeint-strategy"],
    outputFile: resolvePath(context.emitterOutputDir, outputFile),
  };
}

export interface ResolvedOpenAPI3EmitterOptions {
  fileType: FileType;
  outputFile: string;
  newLine: NewLine;
  omitUnreachableTypes: boolean;
  includeXTypeSpecName: "inline-only" | "never";
  safeintStrategy: "double-int" | "int64";
}

function createOAPIEmitter(
  context: EmitContext<OpenAPI3EmitterOptions>,
  options: ResolvedOpenAPI3EmitterOptions
) {
  let program = context.program;
  let schemaEmitter: AssetEmitter<OpenAPI3Schema, OpenAPI3EmitterOptions>;

  let root: OpenAPI3Document;
  let diagnostics: DiagnosticCollector;
  let currentService: Service;
  let serviceAuth: HttpServiceAuthentication;
  // Get the service namespace string for use in name shortening
  let serviceNamespaceName: string | undefined;
  let currentPath: any;

  let metadataInfo: MetadataInfo;
  let visibilityUsage: VisibilityUsageTracker;

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
      return name !== serviceNamespaceName;
    },
  };

  return { emitOpenAPI, getOpenAPI };

  async function emitOpenAPI() {
    const services = await getOpenAPI();
    // first, emit diagnostics
    for (const serviceRecord of services) {
      if (serviceRecord.versioned) {
        for (const documentRecord of serviceRecord.versions) {
          program.reportDiagnostics(documentRecord.diagnostics);
        }
      } else {
        program.reportDiagnostics(serviceRecord.diagnostics);
      }
    }

    if (program.compilerOptions.noEmit || program.hasError()) {
      return;
    }

    const multipleService = services.length > 1;

    for (const serviceRecord of services) {
      if (serviceRecord.versioned) {
        for (const documentRecord of serviceRecord.versions) {
          await emitFile(program, {
            path: resolveOutputFile(serviceRecord.service, multipleService, documentRecord.version),
            content: serializeDocument(documentRecord.document, options.fileType),
            newLine: options.newLine,
          });
        }
      } else {
        await emitFile(program, {
          path: resolveOutputFile(serviceRecord.service, multipleService),
          content: serializeDocument(serviceRecord.document, options.fileType),
          newLine: options.newLine,
        });
      }
    }
  }

  function initializeEmitter(
    service: Service,
    allHttpAuthentications: HttpAuth[],
    defaultAuth: AuthenticationReference,
    version?: string
  ) {
    currentService = service;
    metadataInfo = createMetadataInfo(program, {
      canonicalVisibility: Visibility.Read,
      canShareProperty: (p) => isReadonlyProperty(program, p),
    });
    visibilityUsage = resolveVisibilityUsage(
      program,
      metadataInfo,
      service.type,
      options.omitUnreachableTypes
    );
    schemaEmitter = createAssetEmitter(
      program,
      class extends OpenAPI3SchemaEmitter {
        constructor(emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>) {
          super(emitter, metadataInfo, visibilityUsage, options);
        }
      } as any,
      context
    );

    const securitySchemes = getOpenAPISecuritySchemes(allHttpAuthentications);
    const security = getOpenAPISecurity(defaultAuth);

    const info = resolveInfo(program, service.type);
    root = {
      openapi: "3.0.0",
      info: {
        title: "(title)",
        ...info,
        version: version ?? info?.version ?? "0.0.0",
      },
      externalDocs: getExternalDocs(program, service.type),
      tags: [],
      paths: {},
      security: security.length > 0 ? security : undefined,
      components: {
        parameters: {},
        requestBodies: {},
        responses: {},
        schemas: {},
        examples: {},
        securitySchemes: securitySchemes,
      },
    };
    diagnostics = createDiagnosticCollector();
    const servers = getServers(program, service.type);
    if (servers) {
      root.servers = resolveServers(servers);
    }

    attachExtensions(program, service.type, root);
    serviceNamespaceName = getNamespaceFullName(service.type);
    currentPath = root.paths;

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
      diagnostics.add(
        createDiagnostic({
          code: "invalid-server-variable",
          format: { propName: prop.name },
          target: prop,
        })
      );
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
          default: prop.defaultValue ? getDefaultValue(program, prop.defaultValue) : "",
          description: getDoc(program, prop),
        };

        if (prop.type.kind === "Enum") {
          variable.enum = getSchemaValue(prop.type, Visibility.Read, "application/json")
            .enum as any;
        } else if (prop.type.kind === "Union") {
          variable.enum = getSchemaValue(prop.type, Visibility.Read, "application/json")
            .enum as any;
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

  async function getOpenAPI(): Promise<OpenAPI3ServiceRecord[]> {
    const serviceRecords: OpenAPI3ServiceRecord[] = [];
    const services = listServices(program);
    if (services.length === 0) {
      services.push({ type: program.getGlobalNamespaceType() });
    }
    for (const service of services) {
      const versions = buildVersionProjections(program, service.type);
      if (versions.length === 1 && versions[0].version === undefined) {
        // non-versioned spec
        const document = await getProjectedOpenAPIDocument(service, versions[0]);
        if (document === undefined) {
          // an error occurred producing this document, so don't return it
          return serviceRecords;
        }

        serviceRecords.push({
          service,
          versioned: false,
          document: document[0],
          diagnostics: document[1],
        });
      } else {
        // versioned spec
        const serviceRecord: OpenAPI3VersionedServiceRecord = {
          service,
          versioned: true,
          versions: [],
        };
        serviceRecords.push(serviceRecord);

        for (const record of versions) {
          const document = await getProjectedOpenAPIDocument(service, record);
          if (document === undefined) {
            // an error occurred producing this document
            continue;
          }

          serviceRecord.versions.push({
            service,
            version: record.version!,
            document: document[0],
            diagnostics: document[1],
          });
        }
      }
    }

    return serviceRecords;

    async function getProjectedOpenAPIDocument(service: Service, record: VersionProjections) {
      const commonProjections: ProjectionApplication[] = [
        {
          projectionName: "target",
          arguments: ["json"],
        },
      ];
      const originalProgram = program;
      const projectedProgram = (program = projectProgram(originalProgram, [
        ...commonProjections,
        ...record.projections,
      ]));
      const projectedServiceNs: Namespace = projectedProgram.projector.projectedTypes.get(
        service.type
      ) as Namespace;

      const document = await getOpenApiFromVersion(
        projectedServiceNs === projectedProgram.getGlobalNamespaceType()
          ? { type: projectedProgram.getGlobalNamespaceType() }
          : getService(program, projectedServiceNs)!,
        record.version
      );

      return document;
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
  function deduplicateCommonResponses(
    statusCodeResponses: HttpOperationResponse[]
  ): HttpOperationResponse[] {
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
   * Validates that common parameters are consistent and returns the minimal set that describes the differences.
   */
  function resolveSharedRouteParameters(ops: HttpOperation[]): HttpOperationParameter[] {
    const finalParams: HttpOperationParameter[] = [];
    const parameters = new Map<string, HttpOperationParameter[]>();
    for (const op of ops) {
      for (const parameter of op.parameters.parameters) {
        const existing = parameters.get(parameter.name);
        if (existing) {
          existing.push(parameter);
        } else {
          parameters.set(parameter.name, [parameter]);
        }
      }
    }

    if (parameters.size === 0) {
      return [];
    }
    for (const sharedParams of parameters.values()) {
      const reference = sharedParams[0];

      const inAllOps = ops.length === sharedParams.length;
      const sameLocations = sharedParams.every((p) => p.type === reference.type);
      const sameOptionality = sharedParams.every(
        (p) => p.param.optional === reference.param.optional
      );
      const sameTypeKind = sharedParams.every(
        (p) => p.param.type.kind === reference.param.type.kind
      );
      const sameTypeValue = sharedParams.every((p) => p.param.type === reference.param.type);

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
        sharedParams.forEach((p) => {
          p.param.optional = true;
        });
        finalParams.push(...sharedParams);
      } else {
        finalParams.push(...sharedParams);
      }
    }
    return finalParams;
  }

  function buildSharedOperation(operations: HttpOperation[]): SharedHttpOperation {
    return {
      kind: "shared",
      operations: operations,
    };
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
        result.push(buildSharedOperation(ops));
      }
    }
    return result;
  }

  async function getOpenApiFromVersion(
    service: Service,
    version?: string
  ): Promise<[OpenAPI3Document, Readonly<Diagnostic[]>] | undefined> {
    try {
      const httpService = ignoreDiagnostics(getHttpService(program, service.type));
      const auth = (serviceAuth = resolveAuthentication(httpService));

      initializeEmitter(service, auth.schemes, auth.defaultAuth, version);
      reportIfNoRoutes(program, httpService.operations);

      for (const op of resolveOperations(httpService.operations)) {
        const result = getOperationOrSharedOperation(op);
        if (result) {
          const { operation, path, verb } = result;
          currentPath[path] ??= {};
          currentPath[path][verb] = operation;
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

      return [root, diagnostics.diagnostics];
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

  function computeSharedOperationId(shared: SharedHttpOperation) {
    return shared.operations.map((op) => resolveOperationId(program, op.operation)).join("_");
  }

  function getOperationOrSharedOperation(operation: HttpOperation | SharedHttpOperation):
    | {
        operation: OpenAPI3Operation;
        path: string;
        verb: string;
      }
    | undefined {
    if (isSharedHttpOperation(operation)) {
      return getSharedOperation(operation);
    } else {
      return getOperation(operation);
    }
  }

  function getSharedOperation(shared: SharedHttpOperation): {
    operation: OpenAPI3Operation;
    path: string;
    verb: string;
  } {
    const operations = shared.operations;
    const verb = operations[0].verb;
    const path = operations[0].path;
    const examples = resolveOperationExamples(program, shared);
    const oai3Operation: OpenAPI3Operation = {
      operationId: computeSharedOperationId(shared),
      parameters: [],
      description: joinOps(operations, getDoc, " "),
      summary: joinOps(operations, getSummary, " "),
      responses: getSharedResponses(shared, examples),
    };

    for (const op of operations) {
      applyExternalDocs(op.operation, oai3Operation);
      attachExtensions(program, op.operation, oai3Operation);
      if (isDeprecated(program, op.operation)) {
        oai3Operation.deprecated = true;
      }
    }

    for (const op of operations) {
      const opTags = getAllTags(program, op.operation);
      if (opTags) {
        const currentTags = oai3Operation.tags;
        if (currentTags) {
          // combine tags but eliminate duplicates
          oai3Operation.tags = [...new Set([...currentTags, ...opTags])];
        } else {
          oai3Operation.tags = opTags;
        }
        for (const tag of opTags) {
          // Add to root tags if not already there
          tags.add(tag);
        }
      }
    }

    // Error out if shared routes do not have consistent `@parameterVisibility`. We can
    // lift this restriction in the future if a use case develops.
    const visibilities = operations.map((op) =>
      resolveRequestVisibility(program, op.operation, verb)
    );
    if (visibilities.some((v) => v !== visibilities[0])) {
      diagnostics.add(
        createDiagnostic({
          code: "inconsistent-shared-route-request-visibility",
          target: operations[0].operation,
        })
      );
    }
    const visibility = visibilities[0];
    oai3Operation.parameters = getEndpointParameters(
      resolveSharedRouteParameters(operations),
      visibility
    );

    const bodies = [
      ...new Set(operations.map((op) => op.parameters.body).filter((x) => x !== undefined)),
    ];
    if (bodies) {
      oai3Operation.requestBody = getRequestBody(bodies, visibility, examples);
    }
    const authReference = serviceAuth.operationsAuth.get(shared.operations[0].operation);
    if (authReference) {
      oai3Operation.security = getEndpointSecurity(authReference);
    }

    return { operation: oai3Operation, verb, path };
  }

  function getOperation(
    operation: HttpOperation
  ): { operation: OpenAPI3Operation; path: string; verb: string } | undefined {
    const { path: fullPath, operation: op, verb, parameters } = operation;
    // If path contains a query string, issue msg and don't emit this endpoint
    if (fullPath.indexOf("?") > 0) {
      diagnostics.add(createDiagnostic({ code: "path-query", target: op }));
      return undefined;
    }
    const visibility = resolveRequestVisibility(program, operation.operation, verb);
    const examples = resolveOperationExamples(program, operation);
    const oai3Operation: OpenAPI3Operation = {
      operationId: resolveOperationId(program, operation.operation),
      summary: getSummary(program, operation.operation),
      description: getDoc(program, operation.operation),
      parameters: getEndpointParameters(parameters.parameters, visibility),
      responses: getResponses(operation, operation.responses, examples),
    };
    const currentTags = getAllTags(program, op);
    if (currentTags) {
      oai3Operation.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }
    applyExternalDocs(op, oai3Operation);
    // Set up basic endpoint fields

    if (parameters.body) {
      oai3Operation.requestBody = getRequestBody(
        parameters.body && [parameters.body],
        visibility,
        examples
      );
    }
    const authReference = serviceAuth.operationsAuth.get(operation.operation);
    if (authReference) {
      oai3Operation.security = getEndpointSecurity(authReference);
    }
    if (isDeprecated(program, op)) {
      oai3Operation.deprecated = true;
    }
    attachExtensions(program, op, oai3Operation);
    return { operation: oai3Operation, path: fullPath, verb };
  }

  function getSharedResponses(
    operation: SharedHttpOperation,
    examples: OperationExamples
  ): Record<string, Refable<OpenAPI3Response>> {
    const responseMap = new Map<string, HttpOperationResponse[]>();
    for (const op of operation.operations) {
      for (const response of op.responses) {
        const statusCodes = diagnostics.pipe(
          getOpenAPI3StatusCodes(program, response.statusCodes, op.operation)
        );
        for (const statusCode of statusCodes) {
          if (responseMap.has(statusCode)) {
            responseMap.get(statusCode)!.push(response);
          } else {
            responseMap.set(statusCode, [response]);
          }
        }
      }
    }
    const result: Record<string, Refable<OpenAPI3Response>> = {};

    for (const [statusCode, statusCodeResponses] of responseMap) {
      const dedupeResponses = deduplicateCommonResponses(statusCodeResponses);
      result[statusCode] = getResponseForStatusCode(
        operation,
        statusCode,
        dedupeResponses,
        examples
      );
    }
    return result;
  }

  function getResponses(
    operation: HttpOperation,
    responses: HttpOperationResponse[],
    examples: OperationExamples
  ): Record<string, Refable<OpenAPI3Response>> {
    const result: Record<string, Refable<OpenAPI3Response>> = {};
    for (const response of responses) {
      for (const statusCode of diagnostics.pipe(
        getOpenAPI3StatusCodes(program, response.statusCodes, response.type)
      )) {
        result[statusCode] = getResponseForStatusCode(operation, statusCode, [response], examples);
      }
    }
    return result;
  }

  function isBinaryPayload(body: Type, contentType: string) {
    return (
      body.kind === "Scalar" &&
      body.name === "bytes" &&
      contentType !== "application/json" &&
      contentType !== "text/plain"
    );
  }

  function getResponseForStatusCode(
    operation: HttpOperation | SharedHttpOperation,
    statusCode: OpenAPI3StatusCode,
    responses: HttpOperationResponse[],
    examples: OperationExamples
  ): Refable<OpenAPI3Response> {
    const openApiResponse: OpenAPI3Response = {
      description: "",
    };
    const schemaMap = new Map<string, any[]>();
    for (const response of responses) {
      const refUrl = getRef(program, response.type);
      if (refUrl) {
        return { $ref: refUrl };
      }
      if (response.description && response.description !== openApiResponse.description) {
        openApiResponse.description = openApiResponse.description
          ? `${openApiResponse.description} ${response.description}`
          : response.description;
      }
      emitResponseHeaders(openApiResponse, response.responses, response.type);
      emitResponseContent(
        operation,
        openApiResponse,
        response.responses,
        statusCode,
        examples,
        schemaMap
      );
      if (!openApiResponse.description) {
        openApiResponse.description = getResponseDescriptionForStatusCode(statusCode);
      }
    }

    return openApiResponse;
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
              diagnostics.add(
                createDiagnostic({
                  code: "duplicate-header",
                  format: { header: key },
                  target: target,
                })
              );
            }
            continue;
          }
          obj.headers[key] = headerVal;
        }
      }
    }
  }

  function emitResponseContent(
    operation: HttpOperation | SharedHttpOperation,
    obj: OpenAPI3Response,
    responses: HttpOperationResponseContent[],
    statusCode: OpenAPI3StatusCode,
    examples: OperationExamples,
    schemaMap: Map<string, OpenAPI3MediaType[]> | undefined = undefined
  ) {
    schemaMap ??= new Map<string, OpenAPI3MediaType[]>();
    for (const data of responses) {
      if (data.body === undefined) {
        continue;
      }
      obj.content ??= {};
      for (const contentType of data.body.contentTypes) {
        const contents = getBodyContentEntry(
          data.body,
          Visibility.Read,
          contentType,
          examples.responses[statusCode]?.[contentType]
        );
        if (schemaMap.has(contentType)) {
          schemaMap.get(contentType)!.push(contents);
        } else {
          schemaMap.set(contentType, [contents]);
        }
      }

      for (const [contentType, contents] of schemaMap) {
        if (contents.length === 1) {
          obj.content[contentType] = contents[0];
        } else {
          obj.content[contentType] = {
            schema: { anyOf: contents.map((x) => x.schema) as any },
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

  function callSchemaEmitter(
    type: Type,
    visibility: Visibility,
    ignoreMetadataAnnotations?: boolean,
    contentType?: string
  ): Refable<OpenAPI3Schema> {
    const result = emitTypeWithSchemaEmitter(
      type,
      visibility,
      ignoreMetadataAnnotations,
      contentType
    );

    switch (result.kind) {
      case "code":
        return result.value as any;
      case "declaration":
        return { $ref: `#/components/schemas/${result.name}` };
      case "circular":
        diagnostics.add(
          createDiagnostic({
            code: "inline-cycle",
            format: { type: getOpenAPITypeName(program, type, typeNameOptions) },
            target: type,
          })
        );
        return {};
      case "none":
        return {};
    }
  }

  function getSchemaValue(type: Type, visibility: Visibility, contentType: string): OpenAPI3Schema {
    const result = emitTypeWithSchemaEmitter(type, visibility, false, contentType);

    switch (result.kind) {
      case "code":
      case "declaration":
        return result.value as any;
      case "circular":
        diagnostics.add(
          createDiagnostic({
            code: "inline-cycle",
            format: { type: getOpenAPITypeName(program, type, typeNameOptions) },
            target: type,
          })
        );
        return {};
      case "none":
        return {};
    }
  }

  function emitTypeWithSchemaEmitter(
    type: Type,
    visibility: Visibility,
    ignoreMetadataAnnotations?: boolean,
    contentType?: string
  ): EmitEntity<OpenAPI3Schema> {
    if (!metadataInfo.isTransformed(type, visibility)) {
      visibility = Visibility.Read;
    }
    contentType = contentType === "application/json" ? undefined : contentType;
    return schemaEmitter.emitType(type, {
      referenceContext: {
        visibility,
        serviceNamespaceName: serviceNamespaceName,
        ignoreMetadataAnnotations: ignoreMetadataAnnotations ?? false,
        contentType,
      },
    }) as any;
  }

  function getBodyContentEntry(
    body: HttpOperationBody | HttpOperationMultipartBody,
    visibility: Visibility,
    contentType: string,
    examples?: [Example, Type][]
  ): OpenAPI3MediaType {
    const isBinary = isBinaryPayload(body.type, contentType);
    if (isBinary) {
      return { schema: { type: "string", format: "binary" } };
    }

    const oai3Examples = examples && getExampleOrExamples(program, examples);
    switch (body.bodyKind) {
      case "single":
        return {
          schema: getSchemaForSingleBody(
            body.type,
            visibility,
            body.isExplicit && body.containsMetadataAnnotations,
            contentType.startsWith("multipart/") ? contentType : undefined
          ),
          ...oai3Examples,
        };
      case "multipart":
        return {
          ...getBodyContentForMultipartBody(body, visibility, contentType),
          ...oai3Examples,
        };
    }
  }

  function getSchemaForSingleBody(
    type: Type,
    visibility: Visibility,
    ignoreMetadataAnnotations: boolean,
    multipart: string | undefined
  ): any {
    const effectiveType = metadataInfo.getEffectivePayloadType(type, visibility);
    return callSchemaEmitter(
      effectiveType,
      visibility,
      ignoreMetadataAnnotations,
      multipart ?? "application/json"
    );
  }

  function getBodyContentForMultipartBody(
    body: HttpOperationMultipartBody,
    visibility: Visibility,
    contentType: string
  ): OpenAPI3MediaType {
    const properties: Record<string, OpenAPI3Schema> = {};
    const requiredProperties: string[] = [];
    const encodings: Record<string, OpenAPI3Encoding> = {};
    for (const [partIndex, part] of body.parts.entries()) {
      const partName = part.name ?? `part${partIndex}`;
      let schema = isBytesKeptRaw(program, part.body.type)
        ? { type: "string", format: "binary" }
        : getSchemaForSingleBody(
            part.body.type,
            visibility,
            part.body.isExplicit && part.body.containsMetadataAnnotations,
            part.body.type.kind === "Union" ? contentType : undefined
          );

      if (part.multi) {
        schema = {
          type: "array",
          items: schema,
        };
      }
      properties[partName] = schema;

      const encoding = resolveEncodingForMultipartPart(part, visibility, schema);
      if (encoding) {
        encodings[partName] = encoding;
      }
      if (!part.optional) {
        requiredProperties.push(partName);
      }
    }

    const schema: OpenAPI3Schema = {
      type: "object",
      properties,
      required: requiredProperties,
    };

    const name =
      "name" in body.type && body.type.name !== ""
        ? getOpenAPITypeName(program, body.type, typeNameOptions)
        : undefined;
    if (name) {
      root.components!.schemas![name] = schema;
    }
    const result: OpenAPI3MediaType = {
      schema: name ? { $ref: "#/components/schemas/" + name } : schema,
    };

    if (Object.keys(encodings).length > 0) {
      result.encoding = encodings;
    }
    return result;
  }

  function resolveEncodingForMultipartPart(
    part: HttpOperationPart,
    visibility: Visibility,
    schema: OpenAPI3Schema
  ): OpenAPI3Encoding | undefined {
    const encoding: OpenAPI3Encoding = {};
    if (!isDefaultContentTypeForOpenAPI3(part.body.contentTypes, schema)) {
      encoding.contentType = part.body.contentTypes.join(", ");
    }
    const headers = part.headers;
    if (headers.length > 0) {
      encoding.headers = {};
      for (const header of headers) {
        const schema = getOpenAPIParameterBase(header.property, visibility);
        if (schema !== undefined) {
          encoding.headers[header.options.name] = schema;
        }
      }
    }
    if (Object.keys(encoding).length === 0) {
      return undefined;
    }
    return encoding;
  }

  function isDefaultContentTypeForOpenAPI3(
    contentTypes: string[],
    schema: OpenAPI3Schema
  ): boolean {
    if (contentTypes.length === 0) {
      return false;
    }
    if (contentTypes.length > 1) {
      return false;
    }
    const contentType = contentTypes[0];

    switch (contentType) {
      case "text/plain":
        return schema.type === "string" || schema.type === "number";
      case "application/octet-stream":
        return (
          (schema.type === "string" && schema.format === "binary") ||
          (schema.type === "array" &&
            (schema.items as any)?.type === "string" &&
            (schema.items as any)?.format === "binary")
        );
      case "application/json":
        return schema.type === "object";
    }

    return false;
  }

  function getParameter(
    parameter: HttpOperationParameter,
    visibility: Visibility
  ): OpenAPI3Parameter {
    const param: OpenAPI3Parameter = {
      name: parameter.name,
      in: parameter.type,
      ...getOpenAPIParameterBase(parameter.param, visibility),
    } as any;

    const attributes = getParameterAttributes(parameter);
    if (attributes === undefined) {
      param.schema = {
        type: "string",
      };
    } else {
      Object.assign(param, attributes);
    }

    return param;
  }

  function getEndpointParameters(
    parameters: HttpOperationParameter[],
    visibility: Visibility
  ): Refable<OpenAPI3Parameter>[] {
    const result: Refable<OpenAPI3Parameter>[] = [];
    for (const httpOpParam of parameters) {
      if (params.has(httpOpParam.param)) {
        result.push(params.get(httpOpParam.param));
        continue;
      }
      // eslint-disable-next-line deprecation/deprecation
      if (httpOpParam.type === "header" && isContentTypeHeader(program, httpOpParam.param)) {
        continue;
      }
      const param = getParameterOrRef(httpOpParam, visibility);
      if (param) {
        const existing = result.find(
          (x) => !("$ref" in param) && !("$ref" in x) && x.name === param.name && x.in === param.in
        );
        if (existing && !("$ref" in param) && !("$ref" in existing)) {
          mergeOpenApiParameters(existing, param);
        } else {
          result.push(param);
        }
      }
    }
    return result;
  }

  function getRequestBody(
    bodies: (HttpOperationBody | HttpOperationMultipartBody)[] | undefined,
    visibility: Visibility,
    examples: OperationExamples
  ): OpenAPI3RequestBody | undefined {
    if (bodies === undefined || bodies.every((x) => isVoidType(x.type))) {
      return undefined;
    }
    const requestBody: OpenAPI3RequestBody = {
      required: bodies.every((body) => (body.property ? !body.property.optional : true)),
      content: {},
    };
    const schemaMap = new Map<string, OpenAPI3MediaType[]>();
    for (const body of bodies.filter((x) => !isVoidType(x.type))) {
      const desc = body.property ? getDoc(program, body.property) : undefined;
      if (desc) {
        requestBody.description = requestBody.description
          ? `${requestBody.description} ${desc}`
          : desc;
      }
      const contentTypes = body.contentTypes.length > 0 ? body.contentTypes : ["application/json"];
      for (const contentType of contentTypes) {
        const existing = schemaMap.get(contentType);
        const entry = getBodyContentEntry(
          body,
          visibility,
          contentType,
          examples.requestBody[contentType]
        );
        if (existing) {
          existing.push(entry);
        } else {
          schemaMap.set(contentType, [entry]);
        }
      }
    }

    for (const [contentType, schemaArray] of schemaMap) {
      if (schemaArray.length === 1) {
        requestBody.content[contentType] = schemaArray[0];
      } else {
        requestBody.content[contentType] = {
          schema: { anyOf: schemaArray.map((x) => x.schema).filter((x) => x !== undefined) },
          encoding: schemaArray.find((x) => x.encoding)?.encoding,
        };
      }
    }

    return requestBody;
  }

  function getParameterOrRef(
    parameter: HttpOperationParameter,
    visibility: Visibility
  ): Refable<OpenAPI3Parameter> | undefined {
    if (isNeverType(parameter.param.type)) {
      return undefined;
    }

    let spreadParam = false;
    let property = parameter.param;

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

    const param = getParameter(parameter, visibility);

    // only parameters inherited by spreading from non-inlined type are shared in #/components/parameters
    if (spreadParam && property.model && !shouldInline(program, property.model)) {
      params.set(property, param);
      paramModels.add(property.model);
    }

    return param;
  }

  function getOpenAPIParameterBase(
    param: ModelProperty,
    visibility: Visibility
  ): OpenAPI3ParameterBase | undefined {
    const typeSchema = getSchemaForType(param.type, visibility);
    if (!typeSchema) {
      return undefined;
    }
    const schema = applyEncoding(
      program,
      param,
      applyIntrinsicDecorators(param, typeSchema),
      options
    );
    if (param.defaultValue) {
      schema.default = getDefaultValue(program, param.defaultValue);
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
    target: OpenAPI3Parameter,
    apply: OpenAPI3Parameter
  ): OpenAPI3Parameter {
    if (target.schema) {
      const schema = target.schema;
      if (schema.enum && apply.schema.enum) {
        schema.enum = [...new Set([...schema.enum, ...apply.schema.enum])];
      }
      target.schema = schema;
    } else {
      Object.assign(target, apply);
    }
    return target;
  }

  function getParameterAttributes(
    parameter: HttpOperationParameter
  ): { style?: string; explode?: boolean } | undefined {
    switch (parameter.type) {
      case "header":
        return mapHeaderParameterFormat(parameter);
      case "query":
        return getQueryParameterAttributes(parameter);
      case "path":
        return getPathParameterAttributes(parameter);
    }
  }

  function getPathParameterAttributes(parameter: HttpOperationParameter & { type: "path" }) {
    if (parameter.allowReserved) {
      diagnostics.add(
        createDiagnostic({
          code: "path-reserved-expansion",
          target: parameter.param,
        })
      );
    }

    const attributes: { style?: string; explode?: boolean } = {};

    if (parameter.explode) {
      attributes.explode = true;
    }

    switch (parameter.style) {
      case "label":
        attributes.style = "label";
        break;
      case "matrix":
        attributes.style = "matrix";
        break;
      case "simple":
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-style",
            format: { style: parameter.style, paramType: "path" },
            target: parameter.param,
          })
        );
    }

    return attributes;
  }

  function getQueryParameterAttributes(parameter: HttpOperationParameter & { type: "query" }) {
    const attributes: { style?: string; explode?: boolean } = {};

    if (parameter.explode) {
      attributes.explode = true;
    }

    switch (parameter.format) {
      case "ssv":
        return { style: "spaceDelimited", explode: false };
      case "pipes":
        return { style: "pipeDelimited", explode: false };
      case undefined:
      case "csv":
      case "simple":
      case "multi":
      case "form":
        return attributes;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-format",
            format: {
              paramType: "query",
              value: parameter.format,
            },
            target: parameter.param,
          })
        );
        return undefined;
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
        diagnostics.add(
          createDiagnostic({
            code: "invalid-format",
            format: {
              paramType: "header",
              value: parameter.format,
            },
            target: parameter.param,
          })
        );
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
        if (isOrExtendsHttpFile(program, type)) {
          return;
        }
        if (
          visibilityUsage.isUnreachable(type) &&
          !paramModels.has(type) &&
          !shouldInline(program, type)
        ) {
          callSchemaEmitter(type, Visibility.All);
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
        oneOf: [newTarget, callSchemaEmitter(values, Visibility.Read, false, "application/json")],
      };
    }

    attachExtensions(program, typespecType, newTarget);

    return newTarget;
  }

  function applyExternalDocs(typespecType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(program, typespecType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  function getOpenAPISecuritySchemes(
    httpAuthentications: HttpAuth[]
  ): Record<string, OpenAPI3SecurityScheme> {
    const schemes: Record<string, OpenAPI3SecurityScheme> = {};
    for (const httpAuth of httpAuthentications) {
      const scheme = getOpenAPI3Scheme(httpAuth);
      if (scheme) {
        schemes[httpAuth.id] = scheme;
      }
    }
    return schemes;
  }

  function getOpenAPISecurity(authReference: AuthenticationReference) {
    const security = authReference.options.map((authOption: AuthenticationOptionReference) => {
      const securityOption: Record<string, string[]> = {};
      for (const httpAuthRef of authOption.all) {
        switch (httpAuthRef.kind) {
          case "noAuth":
            // should emit "{}" as a security option https://github.com/OAI/OpenAPI-Specification/issues/14#issuecomment-297457320
            continue;
          case "oauth2":
            securityOption[httpAuthRef.auth.id] = httpAuthRef.scopes;
            continue;
          default:
            securityOption[httpAuthRef.auth.id] = [];
        }
      }
      return securityOption;
    });
    return security;
  }

  function getEndpointSecurity(
    authReference: AuthenticationReference
  ): Record<string, string[]>[] | undefined {
    const security = getOpenAPISecurity(authReference);
    if (deepEquals(security, root.security)) {
      return undefined;
    }
    if (security.length > 0) {
      return security;
    }
    return undefined;
  }

  function getOpenAPI3Scheme(auth: HttpAuth): OpenAPI3SecurityScheme | undefined {
    const scheme = getOpenAPI3SchemeInternal(auth);

    if (scheme) {
      attachExtensions(program, auth.model, scheme);
    }
    return scheme;
  }
  function getOpenAPI3SchemeInternal(auth: HttpAuth): OpenAPI3SecurityScheme | undefined {
    switch (auth.type) {
      case "http":
        return { type: "http", scheme: auth.scheme, description: auth.description };
      case "apiKey":
        return { type: "apiKey", in: auth.in, name: auth.name, description: auth.description };
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
        return { type: "oauth2", flows, description: auth.description };
      case "openIdConnect":
        return {
          type: "openIdConnect",
          openIdConnectUrl: auth.openIdConnectUrl,
          description: auth.description,
        };
      case "noAuth":
        return undefined;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "unsupported-auth",
            format: { authType: (auth as any).type },
            target: currentService.type,
          })
        );
        return undefined;
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
