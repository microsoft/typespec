import {
  BooleanLiteral,
  compilerAssert,
  emitFile,
  EmitOptionsFor,
  Enum,
  EnumMember,
  getAllTags,
  getDoc,
  getEffectiveModelType,
  getFormat,
  getIntrinsicModelName,
  getKnownValues,
  getMaxLength,
  getMaxValue,
  getMinLength,
  getMinValue,
  getPattern,
  getProperty,
  getPropertyType,
  getServiceNamespace,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  getSummary,
  ignoreDiagnostics,
  isErrorType,
  isIntrinsic,
  isNeverType,
  isNumericType,
  isSecret,
  isStringType,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  Model,
  ModelProperty,
  Namespace,
  NewLine,
  NumericLiteral,
  Program,
  ProjectionApplication,
  projectProgram,
  resolvePath,
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
  getParameterKey,
  getTypeName,
  isReadonlyProperty,
  resolveOperationId,
  shouldInline,
} from "@cadl-lang/openapi";
import { Discriminator, getDiscriminator, http } from "@cadl-lang/rest";
import {
  createMetadataInfo,
  getAllHttpServices,
  getAuthentication,
  getContentTypes,
  getRequestVisibility,
  getStatusCodeDescription,
  getVisibilitySuffix,
  HttpAuth,
  HttpOperation,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationResponse,
  MetadataInfo,
  reportIfNoRoutes,
  ServiceAuthentication,
  Visibility,
} from "@cadl-lang/rest/http";
import { buildVersionProjections } from "@cadl-lang/versioning";
import { getOneOf, getRef } from "./decorators.js";
import { OpenAPI3EmitterOptions, OpenAPILibrary, reportDiagnostic } from "./lib.js";
import {
  OpenAPI3Discriminator,
  OpenAPI3Document,
  OpenAPI3OAuthFlows,
  OpenAPI3Operation,
  OpenAPI3Parameter,
  OpenAPI3ParameterType,
  OpenAPI3Schema,
  OpenAPI3SchemaProperty,
  OpenAPI3SecurityScheme,
  OpenAPI3Server,
  OpenAPI3ServerVariable,
} from "./types.js";

const defaultOptions = {
  "output-file": "openapi.json",
  "new-line": "lf",
} as const;

export async function $onEmit(p: Program, emitterOptions?: EmitOptionsFor<OpenAPILibrary>) {
  const options = resolveOptions(p, emitterOptions ?? {});
  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

export function resolveOptions(
  program: Program,
  options: OpenAPI3EmitterOptions
): ResolvedOpenAPI3EmitterOptions {
  const resolvedOptions = { ...defaultOptions, ...options };

  return {
    newLine: resolvedOptions["new-line"],
    outputFile: resolvePath(
      program.compilerOptions.outputPath ?? "./cadl-output",
      resolvedOptions["output-file"]
    ),
  };
}

export interface ResolvedOpenAPI3EmitterOptions {
  outputFile: string;
  newLine: NewLine;
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
 * Represents a schema that will be emitted. This is created when a non-inlined
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
      const name = program.checker.getNamespaceString(ns);
      return name !== "Cadl" && name !== serviceNamespace;
    },
  };

  return { emitOpenAPI };

  function initializeEmitter(serviceNamespaceType: Namespace, version?: string) {
    const auth = processAuth(serviceNamespaceType);

    root = {
      openapi: "3.0.0",
      info: {
        title: getServiceTitle(program),
        version: version ?? getServiceVersion(program),
        description: getDoc(program, serviceNamespaceType),
      },
      externalDocs: getExternalDocs(program, serviceNamespaceType),
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
    const servers = http.getServers(program, serviceNamespaceType);
    if (servers) {
      root.servers = resolveServers(servers);
    }

    serviceNamespace = getServiceNamespaceString(program);
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

  // Todo: Should be able to replace with isRelatedTo(prop.type, "string") https://github.com/microsoft/cadl/pull/571
  function isValidServerVariableType(program: Program, type: Type): boolean {
    switch (type.kind) {
      case "String":
        return true;
      case "Model":
        const name = getIntrinsicModelName(program, type);
        return name === "string";
      case "Enum":
        for (const member of type.members.values()) {
          if (member.value && typeof member.value !== "string") {
            return false;
          }
        }
        return true;
      case "Union":
        for (const option of type.options) {
          if (!isValidServerVariableType(program, option)) {
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
    const serviceNs = getServiceNamespace(program);
    if (!serviceNs) {
      return;
    }
    const commonProjections: ProjectionApplication[] = [
      {
        projectionName: "target",
        arguments: ["json"],
      },
    ];
    const originalProgram = program;
    const versions = buildVersionProjections(program, serviceNs);
    for (const record of versions) {
      if (record.version) {
        record.projections.push({
          projectionName: "atVersion",
          arguments: [record.version],
        });
      }

      program = projectProgram(originalProgram, [...commonProjections, ...record.projections]);

      await emitOpenAPIFromVersion(serviceNs, record.version);
    }
  }

  async function emitOpenAPIFromVersion(serviceNamespace: Namespace, version?: string) {
    initializeEmitter(serviceNamespace, version);
    try {
      const [services] = getAllHttpServices(program);
      const service = services[0];
      reportIfNoRoutes(program, service.operations);

      for (const operation of service.operations) {
        emitOperation(operation);
      }
      emitParameters();
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
        const outPath = version
          ? resolvePath(options.outputFile.replace(".json", `.${version}.json`))
          : resolvePath(options.outputFile);

        await emitFile(program, {
          path: outPath,
          content: prettierOutput(JSON.stringify(root, null, 2)),
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

    attachExtensions(program, op, currentEndpoint);
  }

  function emitResponses(responses: HttpOperationResponse[]) {
    for (const response of responses) {
      emitResponseObject(response);
    }
  }

  function isBinaryPayload(body: Type, contentType: string) {
    return (
      body.kind === "Model" &&
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

  function getResponseHeader(prop: ModelProperty) {
    const header: any = {};
    populateParameter(header, prop, "header", Visibility.Read);
    delete header.in;
    delete header.name;
    delete header.required;
    return header;
  }

  function getSchemaOrRef(type: Type, visibility: Visibility): any {
    const refUrl = getRef(program, type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (type.kind === "Model" && type.name === getIntrinsicModelName(program, type)) {
      // if the model is one of the Cadl Intrinsic type.
      // it's a base Cadl "primitive" that corresponds directly to an OpenAPI
      // primitive. In such cases, we don't want to emit a ref and instead just
      // emit the base type directly.
      const builtIn = mapCadlIntrinsicModelToOpenAPI(type, visibility);
      if (builtIn !== undefined) {
        return builtIn;
      }
    }

    if (type.kind === "String" || type.kind === "Number" || type.kind === "Boolean") {
      // For literal types, we just want to emit them directly as well.
      return mapCadlTypeToOpenAPI(type, visibility);
    }

    if (type.kind === "EnumMember") {
      // Enum members are just the OA representation of their values.
      if (typeof type.value === "number") {
        return { type: "number", enum: [type.value] };
      } else {
        return { type: "string", enum: [type.value ?? type.name] };
      }
    }

    type = getEffectiveSchemaType(type, visibility);

    const name = getTypeName(program, type, typeNameOptions);
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

  /**
   * If type is an anonymous model, tries to find a named model that has the same
   * set of properties when non-schema properties are excluded.
   */
  function getEffectiveSchemaType(type: Type, visibility: Visibility): Type {
    if (type.kind === "Model" && !type.name) {
      const effective = getEffectiveModelType(program, type, (p) =>
        metadataInfo.isPayloadProperty(p, visibility)
      );
      if (effective.name) {
        return effective;
      }
    }
    return type;
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
    for (const { type, name, param } of parameters) {
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }

      switch (type) {
        case "path":
          emitParameter(param, "path", visibility);
          break;
        case "query":
          emitParameter(param, "query", visibility);
          break;
        case "header":
          if (name !== "content-type") {
            emitParameter(param, "header", visibility);
          }
          break;
      }
    }
  }

  function emitRequestBody(parameters: HttpOperationParameters, visibility: Visibility) {
    const bodyType = parameters.bodyType;
    const bodyParam = parameters.bodyParameter;

    if (bodyType === undefined) {
      return;
    }

    const requestBody: any = {
      description: bodyParam ? getDoc(program, bodyParam) : undefined,
      content: {},
    };

    const contentTypeParam = parameters.parameters.find(
      (p) => p.type === "header" && p.name === "content-type"
    );
    const contentTypes = contentTypeParam
      ? ignoreDiagnostics(getContentTypes(contentTypeParam.param))
      : ["application/json"];
    for (const contentType of contentTypes) {
      const isBinary = isBinaryPayload(bodyType, contentType);
      const bodySchema = isBinary
        ? { type: "string", format: "binary" }
        : getSchemaOrRef(bodyType, visibility);
      const contentEntry: any = {
        schema: bodySchema,
      };
      requestBody.content[contentType] = contentEntry;
    }

    currentEndpoint.requestBody = requestBody;
  }

  function emitParameter(
    param: ModelProperty,
    kind: OpenAPI3ParameterType,
    visibility: Visibility
  ) {
    const ph = getParamPlaceholder(param);
    currentEndpoint.parameters.push(ph);

    // If the parameter already has a $ref, don't bother populating it
    if (!("$ref" in ph)) {
      populateParameter(ph, param, kind, visibility);
    }
  }

  function populateParameter(
    ph: OpenAPI3Parameter,
    param: ModelProperty,
    kind: OpenAPI3ParameterType,
    visibility: Visibility
  ) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(program, param);

    // Apply decorators to the schema for the parameter.
    const schema = applyIntrinsicDecorators(param, getSchemaForType(param.type, visibility));

    if (param.default) {
      schema.default = getDefaultValue(param.default);
    }
    attachExtensions(program, param, ph);
    // Description is already provided in the parameter itself.
    delete schema.description;
    ph.schema = schema;
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
        let name = getTypeName(program, processed.type, typeNameOptions);
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

    if (type.kind === "Model") {
      return getSchemaForModel(type, visibility);
    } else if (type.kind === "Union") {
      return getSchemaForUnion(type, visibility);
    } else if (type.kind === "UnionVariant") {
      return getSchemaForUnionVariant(type, visibility);
    } else if (type.kind === "Enum") {
      return getSchemaForEnum(type);
    }

    reportDiagnostic(program, {
      code: "invalid-schema",
      format: { type: type.kind },
      target: type,
    });
    return undefined;
  }

  function getSchemaForEnum(e: Enum) {
    const values = [];
    if (e.members.size == 0) {
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
      const mapping = getDiscriminatorMapping(
        discriminator,
        variants.map((v) => v.type) as Model[],
        visibility
      );
      if (mapping) {
        schema.discriminator.mapping = mapping;
      }
    }

    return schema;
  }

  function getSchemaForUnionVariant(variant: UnionVariant, visibility: Visibility) {
    const schema: any = getSchemaForType(variant.type, visibility);
    return schema;
  }

  function isNullType(type: Type): boolean {
    return isIntrinsic(program, type) && getIntrinsicModelName(program, type) === "null";
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
      if (!validateDiscriminator(discriminator, derivedModels)) {
        // appropriate diagnostic is generated with the validate function
        return {};
      }

      const openApiDiscriminator: OpenAPI3Discriminator = { ...discriminator };
      const mapping = getDiscriminatorMapping(discriminator, derivedModels, visibility);
      if (mapping) {
        openApiDiscriminator.mapping = mapping;
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

      if (!prop.optional) {
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

  function validateDiscriminator(
    discriminator: Discriminator,
    childModels: readonly Model[]
  ): boolean {
    const { propertyName } = discriminator;
    const retValues = childModels.map((t) => {
      const prop = getProperty(t, propertyName);
      if (!prop) {
        reportDiagnostic(program, { code: "discriminator", messageId: "missing", target: t });
        return false;
      }
      let retval = true;
      if (!isOasString(prop.type)) {
        reportDiagnostic(program, { code: "discriminator", messageId: "type", target: prop });
        retval = false;
      }
      if (prop.optional) {
        reportDiagnostic(program, { code: "discriminator", messageId: "required", target: prop });
        retval = false;
      }
      return retval;
    });
    // Map of discriminator value to the model in which it is declared
    const discriminatorValues = new Map<string, string>();
    for (const t of childModels) {
      // Get the discriminator property directly in the child model
      const prop = t.properties?.get(propertyName);
      // Issue warning diagnostic if discriminator property missing or is not a string literal
      if (!prop || !isStringLiteral(prop.type)) {
        reportDiagnostic(program, {
          code: "discriminator-value",
          messageId: "literal",
          target: prop || t,
        });
      }
      if (prop) {
        const values = getStringValues(prop.type);
        values.forEach((val) => {
          if (discriminatorValues.has(val)) {
            reportDiagnostic(program, {
              code: "discriminator",
              messageId: "duplicate",
              format: { val: val, model1: discriminatorValues.get(val)!, model2: t.name },
              target: prop,
            });
            retValues.push(false);
          } else {
            discriminatorValues.set(val, t.name);
          }
        });
      }
    }
    return retValues.every((v) => v);
  }

  function getDiscriminatorMapping(
    { propertyName }: Discriminator,
    derivedModels: readonly Model[],
    visibility: Visibility
  ) {
    let mapping: Record<string, string> | undefined = undefined;

    for (const model of derivedModels) {
      const prop = model.properties?.get(propertyName);
      if (!prop) {
        continue;
      }
      for (const key of getStringValues(prop.type)) {
        mapping ??= {};
        mapping[key] = getSchemaOrRef(model, visibility).$ref;
      }
    }
    return mapping;
  }

  // An openapi "string" can be defined in several different ways in Cadl
  function isOasString(type: Type): boolean {
    if (type.kind === "String") {
      // A string literal
      return true;
    } else if (type.kind === "Model" && type.name === "string") {
      // string type
      return true;
    } else if (type.kind === "Union") {
      // A union where all variants are an OasString
      return type.options.every((o) => isOasString(o));
    }
    return false;
  }

  function isStringLiteral(type: Type): boolean {
    return (
      type.kind === "String" ||
      (type.kind === "Union" && type.options.every((o) => o.kind === "String"))
    );
  }

  // Return any string literal values for type
  function getStringValues(type: Type): string[] {
    if (type.kind === "String") {
      return [type.value];
    } else if (type.kind === "Union") {
      return type.options.flatMap(getStringValues).filter((v) => v);
    } else if (type.kind === "EnumMember" && typeof type.value !== "number") {
      return [type.value ?? type.name];
    }
    return [];
  }

  function applyIntrinsicDecorators(
    cadlType: Model | ModelProperty,
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
        const name = getIntrinsicModelName(program, cadlType.indexer.key);
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
    if (!isIntrinsic(program, cadlType)) {
      return undefined;
    }
    const name = getIntrinsicModelName(program, cadlType);
    switch (name) {
      case "bytes":
        return { type: "string", format: "byte" };
      case "int8":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int8" });
      case "int16":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int16" });
      case "int32":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int32" });
      case "int64":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int64" });
      case "safeint":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int64" });
      case "uint8":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint8" });
      case "uint16":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint16" });
      case "uint32":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint32" });
      case "uint64":
        return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint64" });
      case "float64":
        return applyIntrinsicDecorators(cadlType, { type: "number", format: "double" });
      case "float32":
        return applyIntrinsicDecorators(cadlType, { type: "number", format: "float" });
      case "string":
        return applyIntrinsicDecorators(cadlType, { type: "string" });
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

function prettierOutput(output: string) {
  return output + "\n";
}

class ErrorTypeFoundError extends Error {
  constructor() {
    super("Error type found in evaluated Cadl output");
  }
}
