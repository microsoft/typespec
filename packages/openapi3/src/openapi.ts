import {
  BooleanLiteral,
  compilerAssert,
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
  getFormat,
  getKnownValues,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMinItems,
  getMinLength,
  getMinValue,
  getNamespaceFullName,
  getPattern,
  getPropertyType,
  getService,
  getSummary,
  ignoreDiagnostics,
  IntrinsicScalarName,
  IntrinsicType,
  isDeprecated,
  isErrorType,
  isGlobalNamespace,
  isNeverType,
  isNullType,
  isNumericType,
  isSecret,
  isStringType,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  navigateTypesInNamespace,
  NewLine,
  NumericLiteral,
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
} from "@cadl-lang/compiler";

import {
  checkDuplicateTypeName,
  getExtensions,
  getExternalDocs,
  getOpenAPITypeName,
  getParameterKey,
  isReadonlyProperty,
  resolveOperationId,
  shouldInline,
} from "@cadl-lang/openapi";
import { http } from "@cadl-lang/rest";
import {
  createMetadataInfo,
  getAuthentication,
  getHttpService,
  getRequestVisibility,
  getStatusCodeDescription,
  getVisibilitySuffix,
  HttpAuth,
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationResponse,
  isContentTypeHeader,
  isOverloadSameEndpoint,
  MetadataInfo,
  reportIfNoRoutes,
  ServiceAuthentication,
  Visibility,
} from "@cadl-lang/rest/http";
import { buildVersionProjections } from "@cadl-lang/versioning";
import yaml from "js-yaml";
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
} from "./types.js";

const defaultFileType: FileType = "yaml";
const defaultOptions = {
  "new-line": "lf",
  "omit-unreachable-types": false,
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

  const outputFile = resolvedOptions["output-file"] ?? `openapi.${fileType}`;
  return {
    fileType,
    newLine: resolvedOptions["new-line"],
    omitUnreachableTypes: resolvedOptions["omit-unreachable-types"],
    outputFile: resolvePath(context.emitterOutputDir, outputFile),
  };
}

export interface ResolvedOpenAPI3EmitterOptions {
  fileType: FileType;
  outputFile: string;
  newLine: NewLine;
  omitUnreachableTypes: boolean;
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
  /** The CADL type for the schema */
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
  schema: OpenAPI3Schema;
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

  // De-dupe the per-endpoint tags that will be added into the #/tags
  let tags: Set<string>;

  const typeNameOptions: TypeNameOptions = {
    // shorten type names by removing Cadl and service namespace
    namespaceFilter(ns) {
      const name = getNamespaceFullName(ns);
      return name !== "Cadl" && name !== serviceNamespace;
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
    const servers = http.getServers(program, service.type);
    if (servers) {
      root.servers = resolveServers(servers);
    }

    serviceNamespace = getNamespaceFullName(service.type);
    currentPath = root.paths;
    pendingSchemas = new TwoLevelMap();
    refs = new TwoLevelMap();
    metadataInfo = createMetadataInfo(program, {
      canShareProperty: (p) => isReadonlyProperty(program, p),
    });
    inProgressInlineTypes = new Set();
    params = new Map();
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

  function resolveServers(servers: http.HttpServer[]): OpenAPI3Server[] {
    return servers.map((server) => {
      const variables: Record<string, OpenAPI3ServerVariable> = {};
      for (const [name, prop] of server.parameters) {
        if (!validateValidServerVariable(program, prop)) {
          continue;
        }

        const variable: OpenAPI3ServerVariable = {
          default: prop.default ? getDefaultValue(prop.default) : "",
          description: getDoc(program, prop),
        };

        if (prop.type.kind === "Enum") {
          variable.enum = getSchemaForEnum(prop.type).enum;
        } else if (prop.type.kind === "Union") {
          variable.enum = getSchemaForUnion(prop.type, Visibility.All).enum;
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
    const suffix = [];
    if (multipleService) {
      suffix.push(getNamespaceFullName(service.type));
    }
    if (version) {
      suffix.push(version);
    }
    if (suffix.length === 0) {
      return options.outputFile;
    }

    const extension = getAnyExtensionFromPath(options.outputFile);
    const filenameWithoutExtension = options.outputFile.slice(0, -extension.length);
    return `${filenameWithoutExtension}.${suffix.join(".")}${extension}`;
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

      for (const operation of httpService.operations) {
        if (operation.overloading !== undefined && isOverloadSameEndpoint(operation as any)) {
          continue;
        } else {
          emitOperation(operation);
        }
      }
      emitParameters();
      emitUnreferencedSchemas(service.type);
      emitSchemas();
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
        // inserted into the Cadl output
        return;
      } else {
        throw err;
      }
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

    currentEndpoint.operationId = resolveOperationId(program, op);
    applyExternalDocs(op, currentEndpoint);

    // Set up basic endpoint fields
    currentEndpoint.summary = getSummary(program, op);
    currentEndpoint.description = getDoc(program, op);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const visibility = getRequestVisibility(verb);
    emitEndpointParameters(parameters.parameters, visibility);
    emitRequestBody(parameters, visibility);
    emitResponses(operation.responses);

    if (isDeprecated(program, op)) {
      currentEndpoint.deprecated = true;
    }

    attachExtensions(program, op, currentEndpoint);
  }

  function emitResponses(responses: HttpOperationResponse[]) {
    for (const response of responses) {
      emitResponseObject(response);
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

  function getOpenAPIStatuscode(response: HttpOperationResponse): string {
    switch (response.statusCode) {
      case "*":
        return "default";
      default:
        return response.statusCode;
    }
  }

  function emitResponseObject(response: Readonly<HttpOperationResponse>) {
    const statusCode = getOpenAPIStatuscode(response);
    const openapiResponse = currentEndpoint.responses[statusCode] ?? {
      description: response.description ?? getResponseDescriptionForStatusCode(statusCode),
    };

    for (const data of response.responses) {
      if (data.headers && Object.keys(data.headers).length > 0) {
        openapiResponse.headers ??= {};
        // OpenAPI can't represent different headers per content type.
        // So we merge headers here, and report any duplicates.
        // It may be possible in principle to not error for identically declared
        // headers.
        for (const [key, value] of Object.entries(data.headers)) {
          if (openapiResponse.headers[key]) {
            reportDiagnostic(program, {
              code: "duplicate-header",
              format: { header: key },
              target: response.type,
            });
            continue;
          }
          openapiResponse.headers[key] = getResponseHeader(value);
        }
      }

      if (data.body !== undefined) {
        openapiResponse.content ??= {};
        for (const contentType of data.body.contentTypes) {
          const isBinary = isBinaryPayload(data.body.type, contentType);
          const schema = isBinary
            ? { type: "string", format: "binary" }
            : getSchemaOrRef(data.body.type, Visibility.Read);
          openapiResponse.content[contentType] = { schema };
        }
      }
    }

    currentEndpoint.responses[statusCode] = openapiResponse;
  }

  function getResponseDescriptionForStatusCode(statusCode: string) {
    if (statusCode === "default") {
      return "An unexpected error response.";
    }
    return getStatusCodeDescription(statusCode) ?? "unknown";
  }

  function getResponseHeader(prop: ModelProperty): OpenAPI3Header {
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
      return mapCadlTypeToOpenAPI(type, visibility);
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

      // helps to read output and correlate to Cadl
      if (schema) {
        schema["x-cadl-name"] = name;
      }
      return schema;
    } else {
      // Use shared schema when type is not transformed by visibility.
      if (!metadataInfo.isTransformed(type, visibility)) {
        visibility = Visibility.All;
      }
      const pending = pendingSchemas.getOrAdd(type, visibility, () => ({
        type,
        visibility,
        ref: refs.getOrAdd(type, visibility, () => new Ref()),
      }));
      return { $ref: pending.ref };
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
    }

    return placeholder;
  }

  function emitEndpointParameters(parameters: HttpOperationParameter[], visibility: Visibility) {
    for (const parameter of parameters) {
      const { type, param } = parameter;
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }

      switch (type) {
        case "path":
          emitParameter(parameter, visibility);
          break;
        case "query":
          emitParameter(parameter, visibility);
          break;
        case "header":
          if (!isContentTypeHeader(program, param)) {
            emitParameter(parameter, visibility);
          }
          break;
      }
    }
  }

  function emitRequestBody(parameters: HttpOperationParameters, visibility: Visibility) {
    const body = parameters.body;
    if (body === undefined) {
      return;
    }

    const requestBody: any = {
      description: body.parameter ? getDoc(program, body.parameter) : undefined,
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
    const ph = getParamPlaceholder(parameter.param);
    currentEndpoint.parameters.push(ph);

    // If the parameter already has a $ref, don't bother populating it
    if (!("$ref" in ph)) {
      populateParameter(ph, parameter, visibility);
    }
  }

  function getOpenAPIParameterBase(
    param: ModelProperty,
    visibility: Visibility
  ): OpenAPI3ParameterBase {
    const schema = applyIntrinsicDecorators(param, getSchemaForType(param.type, visibility));
    if (param.default) {
      schema.default = getDefaultValue(param.default);
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

  function populateParameter(
    ph: OpenAPI3Parameter,
    parameter: HttpOperationParameter,
    visibility: Visibility
  ) {
    ph.name = parameter.name;
    ph.in = parameter.type;
    Object.assign(ph, getOpenAPIParameterBase(parameter.param, visibility));
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

  function emitUnreferencedSchemas(namespace: Namespace) {
    if (options.omitUnreachableTypes) {
      return;
    }
    const computeSchema = (x: Type) => getSchemaOrRef(x, Visibility.All);

    const skipSubNamespaces = isGlobalNamespace(program, namespace);
    navigateTypesInNamespace(
      namespace,
      {
        model: (x) => x.name !== "" && computeSchema(x),
        scalar: computeSchema,
        enum: computeSchema,
        union: (x) => x.name !== undefined && computeSchema(x),
      },
      { skipSubNamespaces }
    );
  }

  function emitSchemas() {
    // Process pending schemas. Note that getSchemaForType may pull in new
    // pending schemas so we iterate until there are no pending schemas
    // remaining.
    const processedSchemas = new TwoLevelMap<Type, Visibility, ProcessedSchema>();
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

    // Emit the processed schemas. Only now can we compute the names as it
    // depends on whether we have produced multiple schemas for a single
    // CADL type.
    for (const group of processedSchemas.values()) {
      for (const [visibility, processed] of group) {
        let name = getOpenAPITypeName(program, processed.type, typeNameOptions);
        if (group.size > 1) {
          name += getVisibilitySuffix(visibility);
        }
        checkDuplicateTypeName(program, processed.type, name, root.components!.schemas);
        processed.ref.value = "#/components/schemas/" + encodeURIComponent(name);
        root.components!.schemas![name] = processed.schema;
      }
    }
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags!.push({ name: tag });
    }
  }

  function getSchemaForType(type: Type, visibility: Visibility) {
    const builtinType = mapCadlTypeToOpenAPI(type, visibility);
    if (builtinType !== undefined) return builtinType;

    switch (type.kind) {
      case "Intrinsic":
        return getSchemaForIntrinsicType(type);
      case "Model":
        return getSchemaForModel(type, visibility);
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
      reportUnsupportedUnion("empty");
      return undefined;
    }
    const type = enumMemberType(e.members.values().next().value);
    for (const option of e.members.values()) {
      if (type !== enumMemberType(option)) {
        reportUnsupportedUnion();
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

    function reportUnsupportedUnion(messageId: "default" | "empty" = "default") {
      reportDiagnostic(program, { code: "union-unsupported", messageId, target: e });
    }
  }

  /**
   * A Cadl union maps to a variety of OA3 structures according to the following rules:
   *
   * * A union containing `null` makes a `nullable` schema comprised of the remaining
   *   union variants.
   * * A union containing literal types are converted to OA3 enums. All literals of the
   *   same type are combined into single enums.
   * * A union that contains multiple items (after removing null and combining like-typed
   *   literals into enums) is an `anyOf` union unless `oneOf` is applied to the union
   *   declaration.
   */
  function getSchemaForUnion(union: Union, visibility: Visibility) {
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
          const enumSchema = mapCadlTypeToOpenAPI(variant.type, visibility);
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
      schema.discriminator = discriminator;
      // Diagnostic already reported in compiler for unions
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(union, discriminator));
      if (discriminatedUnion.variants.size > 0) {
        schema.discriminator.mapping = getDiscriminatorMapping(discriminatedUnion, visibility);
      }
    }

    return schema;
  }

  function getSchemaForUnionVariant(variant: UnionVariant, visibility: Visibility) {
    const schema: any = getSchemaForType(variant.type, visibility);
    return schema;
  }

  function isLiteralType(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral {
    return type.kind === "Boolean" || type.kind === "String" || type.kind === "Number";
  }

  function getDefaultValue(type: Type): any {
    switch (type.kind) {
      case "String":
        return type.value;
      case "Number":
        return type.value;
      case "Boolean":
        return type.value;
      case "Tuple":
        return type.values.map(getDefaultValue);
      case "EnumMember":
        return type.value ?? type.name;
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: type.kind },
          target: type,
        });
    }
  }

  function includeDerivedModel(model: Model): boolean {
    return (
      !isTemplateDeclaration(model) &&
      (model.templateArguments === undefined ||
        model.templateArguments?.length === 0 ||
        model.derivedModels.length > 0)
    );
  }

  function getSchemaForModel(model: Model, visibility: Visibility) {
    let modelSchema: OpenAPI3Schema & Required<Pick<OpenAPI3Schema, "properties">> = {
      type: "object",
      properties: {},
      description: getDoc(program, model),
    };

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
      modelSchema.properties[discriminator.propertyName] = {
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

      modelSchema.properties[name] = resolveProperty(prop, visibility);
    }

    // Special case: if a model type extends a single *templated* base type and
    // has no properties of its own, absorb the definition of the base model
    // into this schema definition.  The assumption here is that any model type
    // defined like this is just meant to rename the underlying instance of a
    // templated type.
    if (
      model.baseModel &&
      isTemplateDeclarationOrInstance(model.baseModel) &&
      Object.keys(modelSchema.properties).length === 0
    ) {
      // Take the base model schema but carry across the documentation property
      // that we set before
      const baseSchema = getSchemaForType(model.baseModel, visibility);
      modelSchema = {
        ...baseSchema,
        description: modelSchema.description,
      };
    } else if (model.baseModel) {
      modelSchema.allOf = [getSchemaOrRef(model.baseModel, visibility)];
    }

    // Attach any OpenAPI extensions
    attachExtensions(program, model, modelSchema);
    return modelSchema;
  }

  function resolveProperty(prop: ModelProperty, visibility: Visibility): OpenAPI3SchemaProperty {
    const description = getDoc(program, prop);

    const schema = getSchemaOrRef(prop.type, visibility);
    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<OpenAPI3Schema> = applyIntrinsicDecorators(prop, {});
    if (description) {
      additionalProps.description = description;
    }

    if (prop.default) {
      additionalProps.default = getDefaultValue(prop.default);
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

  function applyIntrinsicDecorators(
    cadlType: Scalar | ModelProperty,
    target: OpenAPI3Schema
  ): OpenAPI3Schema {
    const newTarget = { ...target };
    const docStr = getDoc(program, cadlType);
    const isString = isStringType(program, getPropertyType(cadlType));
    const isNumeric = isNumericType(program, getPropertyType(cadlType));

    if (!target.description && docStr) {
      newTarget.description = docStr;
    }
    const formatStr = getFormat(program, cadlType);
    if (isString && !target.format && formatStr) {
      newTarget.format = formatStr;
    }

    const pattern = getPattern(program, cadlType);
    if (isString && !target.pattern && pattern) {
      newTarget.pattern = pattern;
    }

    const minLength = getMinLength(program, cadlType);
    if (isString && !target.minLength && minLength !== undefined) {
      newTarget.minLength = minLength;
    }

    const maxLength = getMaxLength(program, cadlType);
    if (isString && !target.maxLength && maxLength !== undefined) {
      newTarget.maxLength = maxLength;
    }

    const minValue = getMinValue(program, cadlType);
    if (isNumeric && !target.minimum && minValue !== undefined) {
      newTarget.minimum = minValue;
    }

    const maxValue = getMaxValue(program, cadlType);
    if (isNumeric && !target.maximum && maxValue !== undefined) {
      newTarget.maximum = maxValue;
    }

    const minItems = getMinItems(program, cadlType);
    if (!target.minItems && minItems !== undefined) {
      newTarget.minItems = minItems;
    }

    const maxItems = getMaxItems(program, cadlType);
    if (!target.maxItems && maxItems !== undefined) {
      newTarget.maxItems = maxItems;
    }

    if (isSecret(program, cadlType)) {
      newTarget.format = "password";
    }

    if (isString) {
      const values = getKnownValues(program, cadlType);
      if (values) {
        return {
          oneOf: [newTarget, getSchemaForEnum(values)],
        };
      }
    }

    attachExtensions(program, cadlType, newTarget);

    return newTarget;
  }

  function applyExternalDocs(cadlType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(program, cadlType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  // Map an Cadl type to an OA schema. Returns undefined when the resulting
  // OA schema is just a regular object schema.
  function mapCadlTypeToOpenAPI(cadlType: Type, visibility: Visibility): any {
    switch (cadlType.kind) {
      case "Number":
        return { type: "number", enum: [cadlType.value] };
      case "String":
        return { type: "string", enum: [cadlType.value] };
      case "Boolean":
        return { type: "boolean", enum: [cadlType.value] };
      case "Model":
        return mapCadlIntrinsicModelToOpenAPI(cadlType, visibility);
    }
  }

  /**
   * Map Cadl intrinsic models to open api definitions
   */
  function mapCadlIntrinsicModelToOpenAPI(
    cadlType: Model,
    visibility: Visibility
  ): any | undefined {
    if (cadlType.indexer) {
      if (isNeverType(cadlType.indexer.key)) {
      } else {
        const name = cadlType.indexer.key.name;
        if (name === "string") {
          return {
            type: "object",
            additionalProperties: getSchemaOrRef(cadlType.indexer.value!, visibility),
          };
        } else if (name === "integer") {
          return {
            type: "array",
            items: getSchemaOrRef(cadlType.indexer.value!, visibility | Visibility.Item),
          };
        }
      }
    }
  }

  function getSchemaForScalar(scalar: Scalar): OpenAPI3Schema {
    let result: OpenAPI3Schema = {};
    if (program.checker.isStdType(scalar)) {
      result = getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = getSchemaForScalar(scalar.baseScalar);
    }
    return applyIntrinsicDecorators(scalar, result);
  }

  function getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPI3Schema {
    switch (scalar.name) {
      case "bytes":
        return { type: "string", format: "byte" };
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
      case "float64":
        return { type: "number", format: "double" };
      case "float32":
        return { type: "number", format: "float" };
      case "string":
        return { type: "string" };
      case "boolean":
        return { type: "boolean" };
      case "plainDate":
        return { type: "string", format: "date" };
      case "zonedDateTime":
        return { type: "string", format: "date-time" };
      case "plainTime":
        return { type: "string", format: "time" };
      case "duration":
        return { type: "string", format: "duration" };
      case "uri":
      case "url":
        return { type: "string", format: "uri" };
      case "integer":
      case "numeric":
      case "float":
        return {}; // Waiting on design for more precise type https://github.com/microsoft/cadl/issues/1260
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
  switch (fileType) {
    case "json":
      return prettierOutput(JSON.stringify(root, null, 2));
    case "yaml":
      return yaml.dump(root, { noRefs: true });
  }
}

function prettierOutput(output: string) {
  return output + "\n";
}

class ErrorTypeFoundError extends Error {
  constructor() {
    super("Error type found in evaluated Cadl output");
  }
}
