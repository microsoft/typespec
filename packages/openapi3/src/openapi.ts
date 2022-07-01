import {
  applyVisibility,
  ArrayType,
  checkIfServiceNamespace,
  EmitOptionsFor,
  EnumMemberType,
  EnumType,
  getAllTags,
  getDoc,
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
  getVisibility,
  ignoreDiagnostics,
  isErrorType,
  isIntrinsic,
  isNumericType,
  isSecret,
  isStringType,
  isTemplate,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  Program,
  resolvePath,
  Type,
  TypeNameOptions,
  UnionType,
  UnionTypeVariant,
} from "@cadl-lang/compiler";
import {
  checkDuplicateTypeName,
  getExtensions,
  getExternalDocs,
  getOperationId,
  getParameterKey,
  getTypeName,
  shouldInline,
} from "@cadl-lang/openapi";
import { Discriminator, getDiscriminator, http } from "@cadl-lang/rest";
import {
  getAllRoutes,
  getContentTypes,
  getRequestVisibility,
  getStatusCodeDescription,
  HttpOperationParameter,
  HttpOperationParameters,
  HttpOperationResponse,
  isSchemaProperty,
  OperationDetails,
  Visibility,
  visibilityToArray,
  visiblityToPascalCase,
} from "@cadl-lang/rest/http";
import { buildVersionProjections } from "@cadl-lang/versioning";
import { getOneOf, getRef } from "./decorators.js";
import { OpenAPILibrary, reportDiagnostic } from "./lib.js";
import {
  OpenAPI3Discriminator,
  OpenAPI3Document,
  OpenAPI3Operation,
  OpenAPI3Parameter,
  OpenAPI3ParameterType,
  OpenAPI3Schema,
  OpenAPI3Server,
  OpenAPI3ServerVariable,
} from "./types.js";

const defaultOptions = {
  outputFile: "openapi.json",
};

export async function $onEmit(p: Program, emitterOptions?: EmitOptionsFor<OpenAPILibrary>) {
  const resolvedOptions = { ...defaultOptions, ...emitterOptions };
  const options: OpenAPIEmitterOptions = {
    outputFile: resolvePath(
      p.compilerOptions.outputPath ?? "./cadl-output",
      resolvedOptions.outputFile
    ),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

// NOTE: These functions aren't meant to be used directly as decorators but as a
// helper functions for other decorators.  The security information given here
// will be inserted into the `security` and `securityDefinitions` sections of
// the emitted OpenAPI document.

const securityDetailsKey = Symbol("securityDetails");
interface SecurityDetails {
  definitions: any;
  requirements: any[];
}

function getSecurityDetails(program: Program, serviceNamespace: NamespaceType): SecurityDetails {
  const definitions = program.stateMap(securityDetailsKey);
  if (definitions.has(serviceNamespace)) {
    return definitions.get(serviceNamespace)!;
  } else {
    const details = { definitions: {}, requirements: [] };
    definitions.set(serviceNamespace, details);
    return details;
  }
}

function getSecurityRequirements(program: Program, serviceNamespace: NamespaceType) {
  return getSecurityDetails(program, serviceNamespace).requirements;
}

function getSecurityDefinitions(program: Program, serviceNamespace: NamespaceType) {
  return getSecurityDetails(program, serviceNamespace).definitions;
}

export function addSecurityRequirement(
  program: Program,
  namespace: NamespaceType,
  name: string,
  scopes: string[]
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    reportDiagnostic(program, {
      code: "security-service-namespace",
      target: namespace,
    });
  }

  const req: any = {};
  req[name] = scopes;
  const requirements = getSecurityRequirements(program, namespace);
  requirements.push(req);
}

export function addSecurityDefinition(
  program: Program,
  namespace: NamespaceType,
  name: string,
  details: any
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    reportDiagnostic(program, {
      code: "security-service-namespace",
      target: namespace,
    });
    return;
  }

  const definitions = getSecurityDefinitions(program, namespace);
  definitions[name] = details;
}

export interface OpenAPIEmitterOptions {
  outputFile: string;
}
/**
 * Represents a node that will hold a JSON reference. The value is computed
 * at the end so that we can defer decisions about the name that is
 * referenced and whether or not two different references will collapse to
 * pointing to the same entity or not, etc. Once all reference values are
 * finalized, the full JSON tree is visited to replace all placeholders with
 * their final string values.
 */
class RefPlaceholder {
  value: string | undefined;
}

/**
 * Represents an OpenAPI schema that has been computed from a Cadl type+visibility.
 */
interface ProcessedSchema {
  /**
   * The openAPI representation of the schema.
   */
  schema: unknown;

  /**
   * The references to the schema. Once we have chosen a name for this
   * schema, we must set these references to point to it.
   */
  placeholders: RefPlaceholder[];
}

function createOAPIEmitter(program: Program, options: OpenAPIEmitterOptions) {
  let root: OpenAPI3Document;

  // Get the service namespace string for use in name shortening
  let serviceNamespace: string | undefined;
  let currentPath: any;
  let currentEndpoint: OpenAPI3Operation;

  // Keep a map of all Types+visibilities encountered that need schema
  // definitions and the reference placeholders that should be made to point
  // to that definition.
  let pendingSchemas = new Map<Type, Map<Visibility, RefPlaceholder[]>>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/components/parameters. Inlined parameters do not go in
  // this map.
  let params: Map<ModelTypeProperty, any>;

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

  function initializeEmitter(serviceNamespaceType: NamespaceType, version?: string) {
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
      components: {
        parameters: {},
        requestBodies: {},
        responses: {},
        schemas: {},
        examples: {},
        securitySchemes: {},
      },
    };
    const servers = http.getServers(program, serviceNamespaceType);
    if (servers) {
      root.servers = resolveServers(servers);
    }

    serviceNamespace = getServiceNamespaceString(program);
    currentPath = root.paths;
    pendingSchemas = new Map();
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
        for (const member of type.members) {
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

  function validateValidServerVariable(program: Program, prop: ModelTypeProperty) {
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
    const versions = buildVersionProjections(program, serviceNs);
    for (const record of versions) {
      if (record.version) {
        record.projections.push({
          projectionName: "atVersion",
          arguments: [record.version],
        });
      }

      if (record.projections.length > 0) {
        program.enableProjections(record.projections);
      }

      await emitOpenAPIFromVersion(serviceNs, record.version);
    }
  }

  async function emitOpenAPIFromVersion(serviceNamespace: NamespaceType, version?: string) {
    initializeEmitter(serviceNamespace, version);
    try {
      const [routes] = getAllRoutes(program);
      for (const operation of routes) {
        emitOperation(operation);
      }
      emitParameters();
      emitSchemas();
      emitTags();

      // Clean up empty entries
      for (const elem of Object.keys(root.components)) {
        if (Object.keys(root.components[elem]).length === 0) {
          delete root.components[elem];
        }
      }

      if (!program.compilerOptions.noEmit && !program.hasError()) {
        // Write out the OpenAPI document to the output path
        const outPath = version
          ? resolvePath(options.outputFile.replace(".json", `.${version}.json`))
          : resolvePath(options.outputFile);

        await program.host.writeFile(outPath, prettierOutput(JSON.stringify(root, null, 2)));
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

  function emitOperation(operation: OperationDetails): void {
    const { path: fullPath, operation: op, groupName, verb, parameters } = operation;

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

    const operationId = getOperationId(program, op);
    if (operationId) {
      currentEndpoint.operationId = operationId;
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = (groupName.length > 0 ? `${groupName}_` : "") + op.name;
    }
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
      return "An unexpected error response";
    }
    return getStatusCodeDescription(statusCode) ?? "unknown";
  }

  function getResponseHeader(prop: ModelTypeProperty) {
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

    type = getEffectiveSchemaType(type);
    const name = getTypeName(program, type, typeNameOptions);

    if (shouldInline(program, type)) {
      [type, visibility] = applyVisibilityForOpenAPI(type, visibility);
      const schema = getSchemaForType(type, visibility);
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
      let map = pendingSchemas.get(type);
      if (!map) {
        map = new Map();
        pendingSchemas.set(type, map);
      }
      const placeholder = new RefPlaceholder();
      const refs = map.get(visibility);
      if (refs) {
        refs.push(placeholder);
      } else {
        map.set(visibility, [placeholder]);
      }

      return { $ref: placeholder };
    }
  }

  function applyVisibilityForOpenAPI(type: Type, visibility: Visibility): [Type, Visibility] {
    if (type.kind !== "Model" || visibility === Visibility.All) {
      return [type, Visibility.All];
    }

    // apply visibility, but keep all properties that can be represented as
    // readonly: true, regardless of visibility. This allows sharing
    const t = applyVisibility(program, type, visibilityToArray(visibility)!, isReadonlyProperty);
    if (t === type) {
      return [type, Visibility.All];
    }

    return [t, visibility];
  }

  /**
   * If type is an anonymous model, tries to find a named model that has the same
   * set of properties when non-schema properties are excluded.
   */
  function getEffectiveSchemaType(type: Type): Type {
    if (type.kind === "Model" && !type.name) {
      const effective = program.checker.getEffectiveModelType(type, (p) =>
        isSchemaProperty(program, p)
      );
      if (effective.name) {
        return effective;
      }
    }
    return type;
  }

  function getParamPlaceholder(property: ModelTypeProperty) {
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
      // If param is a global parameter, just skip it
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
    if (parameters.body === undefined) {
      return;
    }

    const bodyParam = parameters.body;
    const bodyType = bodyParam.type;

    const requestBody: any = {
      description: getDoc(program, bodyParam),
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
    param: ModelTypeProperty,
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
    param: ModelTypeProperty,
    kind: OpenAPI3ParameterType,
    visibility: Visibility
  ) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(program, param);

    // Apply decorators to the schema for the parameter.
    const schema = applyIntrinsicDecorators(param, getSchemaForType(param.type, visibility));
    if (param.type.kind === "Array") {
      schema.items = getSchemaForType(param.type.elementType, visibility);
    }
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
        root.components.parameters,
        typeNameOptions
      );

      root.components.parameters[key] = { ...param };
      for (const key of Object.keys(param)) {
        delete param[key];
      }

      param.$ref = "#/components/parameters/" + encodeURIComponent(key);
    }
  }

  function emitSchemas() {
    const processedSchemas = new Map<Type, Map<Visibility, ProcessedSchema>>();

    while (pendingSchemas.size > 0) {
      for (const [type, map] of pendingSchemas) {
        pendingSchemas.delete(type);
        let processedSchemasForType = processedSchemas.get(type);
        if (!processedSchemasForType) {
          processedSchemasForType = new Map();
          processedSchemas.set(type, processedSchemasForType);
        }

        for (const [visibility, placeholders] of map) {
          let processedSchema = processedSchemasForType.get(visibility);
          if (processedSchema) {
            processedSchema.placeholders.push(...placeholders);
          } else {
            const [t, v] = applyVisibilityForOpenAPI(type, visibility);
            processedSchema = processedSchemasForType.get(v);
            if (processedSchema) {
              processedSchema.placeholders.push(...placeholders);
            } else {
              const schema = getSchemaForType(t, v);
              processedSchema = { schema, placeholders };
              processedSchemasForType.set(v, processedSchema);
            }
          }
        }
      }
    }

    for (const [type, map] of processedSchemas) {
      const typeName = getTypeName(program, type, typeNameOptions);
      for (const [visibility, processedSchema] of map) {
        let name = typeName;
        if (map.size > 1) {
          name += visiblityToPascalCase(visibility);
        }
        const ref = "#/components/schemas/" + encodeURIComponent(name);
        for (const placeholder of processedSchema.placeholders) {
          placeholder.value = ref;
        }
        checkDuplicateTypeName(program, type, name, root.components.schemas);
        root.components.schemas[name] = processedSchema.schema;
      }
    }

    unboxRefPlaceholders(root);
  }

  function unboxRefPlaceholders(node: any) {
    if (node instanceof RefPlaceholder) {
      node = node.value;
    } else if (Array.isArray(node)) {
      node = node.map(unboxRefPlaceholders);
    } else if (typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        node[key] = unboxRefPlaceholders(value);
      }
    }
    return node;
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags!.push({ name: tag });
    }
  }

  function getSchemaForType(type: Type, visibility: Visibility) {
    const builtinType = mapCadlTypeToOpenAPI(type, visibility);
    if (builtinType !== undefined) return builtinType;

    if (type.kind === "Array") {
      return getSchemaForArray(type, visibility);
    } else if (type.kind === "Model") {
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
    return {};
  }

  function getSchemaForEnum(e: EnumType) {
    const values = [];
    if (e.members.length == 0) {
      reportUnsupportedUnion("empty");
      return undefined;
    }
    const type = enumMemberType(e.members[0]);
    for (const option of e.members) {
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
    function enumMemberType(member: EnumMemberType) {
      if (typeof member.value === "number") {
        return "number";
      }
      return "string";
    }

    function reportUnsupportedUnion(messageId: "default" | "empty" = "default") {
      reportDiagnostic(program, { code: "union-unsupported", messageId, target: e });
    }
  }

  function getSchemaForUnion(union: UnionType, visibility: Visibility) {
    let type: string;
    const nonNullOptions = union.options.filter((t) => !isNullType(t));
    const nullable = union.options.length != nonNullOptions.length;
    if (nonNullOptions.length === 0) {
      reportDiagnostic(program, { code: "union-null", target: union });
      return {};
    }

    const kind = nonNullOptions[0].kind;
    switch (kind) {
      case "String":
        type = "string";
        break;
      case "Number":
        type = "number";
        break;
      case "Boolean":
        type = "boolean";
        break;
      case "Model":
        type = "model";
        break;
      case "UnionVariant":
        type = "model";
        break;
      case "Array":
        type = "array";
        break;
      default:
        reportUnsupportedUnionType(nonNullOptions[0]);
        return {};
    }

    if (type === "model" || type === "array") {
      if (nonNullOptions.length === 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0], visibility);
        if (nullable) {
          schema["nullable"] = true;
        }

        return schema;
      } else {
        const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
        const schema: any = { [ofType]: nonNullOptions.map((s) => getSchemaOrRef(s, visibility)) };
        return schema;
      }
    }

    const values = [];
    for (const option of nonNullOptions) {
      if (option.kind != kind) {
        reportUnsupportedUnion();
      }

      // We already know it's not a model type
      values.push((option as any).value);
    }

    const schema: any = { type };
    if (values.length > 0) {
      schema.enum = values;
    }
    if (nullable) {
      schema["nullable"] = true;
    }

    return schema;

    function reportUnsupportedUnionType(type: Type) {
      reportDiagnostic(program, {
        code: "union-unsupported",
        messageId: "type",
        format: { kind: type.kind },
        target: type,
      });
    }

    function reportUnsupportedUnion() {
      reportDiagnostic(program, { code: "union-unsupported", target: union });
    }
  }

  function getSchemaForUnionVariant(variant: UnionTypeVariant, visibility: Visibility) {
    const schema: any = getSchemaForType(variant.type, visibility);
    return schema;
  }

  function getSchemaForArray(array: ArrayType, visibility: Visibility) {
    const target = array.elementType;

    return {
      type: "array",
      items: getSchemaOrRef(target, visibility),
    };
  }

  function isNullType(type: Type): boolean {
    return isIntrinsic(program, type) && getIntrinsicModelName(program, type) === "null";
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
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: type.kind },
          target: type,
        });
    }
  }

  function includeDerivedModel(model: ModelType): boolean {
    return (
      !isTemplate(model) &&
      (model.templateArguments === undefined ||
        model.templateArguments?.length === 0 ||
        model.derivedModels.length > 0)
    );
  }

  function getSchemaForModel(model: ModelType, visibility: Visibility) {
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

      const openApiDiscriminator = discriminator as OpenAPI3Discriminator;
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
      if (!isSchemaProperty(program, prop)) {
        continue;
      }

      const description = getDoc(program, prop);
      if (!prop.optional) {
        if (!modelSchema.required) {
          modelSchema.required = [];
        }
        modelSchema.required.push(name);
      }

      // Apply decorators on the property to the type's schema
      modelSchema.properties[name] = applyIntrinsicDecorators(
        prop,
        getSchemaOrRef(prop.type, visibility)
      );
      if (description) {
        modelSchema.properties[name].description = description;
      }

      if (prop.default) {
        modelSchema.properties[name].default = getDefaultValue(prop.default);
      }

      if (isReadonlyProperty(prop)) {
        modelSchema.properties[name].readOnly = true;
      }

      // Attach any additional OpenAPI extensions
      attachExtensions(program, prop, modelSchema.properties[name]);
    }

    // Special case: if a model type extends a single *templated* base type and
    // has no properties of its own, absorb the definition of the base model
    // into this schema definition.  The assumption here is that any model type
    // defined like this is just meant to rename the underlying instance of a
    // templated type.
    if (
      model.baseModel &&
      model.baseModel.templateArguments &&
      model.baseModel.templateArguments.length > 0 &&
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
    childModels: readonly ModelType[]
  ): boolean {
    const { propertyName } = discriminator;
    const retVals = childModels.map((t) => {
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
        const vals = getStringValues(prop.type);
        vals.forEach((val) => {
          if (discriminatorValues.has(val)) {
            reportDiagnostic(program, {
              code: "discriminator",
              messageId: "duplicate",
              format: { val: val, model1: discriminatorValues.get(val)!, model2: t.name },
              target: prop,
            });
            retVals.push(false);
          } else {
            discriminatorValues.set(val, t.name);
          }
        });
      }
    }
    return retVals.every((v) => v);
  }

  function getDiscriminatorMapping(
    { propertyName }: Discriminator,
    derivedModels: readonly ModelType[],
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
    }
    return [];
  }

  function isReadonlyProperty(property: ModelTypeProperty) {
    const vis = getVisibility(program, property);
    // note: multiple visibilities that include read are not handled using
    // readonly: true, but using separate schemas as with other visiblities
    // than read.
    return vis?.length === 1 && vis[0] === "read";
  }

  function applyIntrinsicDecorators(cadlType: ModelType | ModelTypeProperty, target: any): any {
    const newTarget = { ...target };
    const docStr = getDoc(program, cadlType);
    const isString = isStringType(program, getPropertyType(cadlType));
    const isNumeric = isNumericType(program, getPropertyType(cadlType));

    if (isString && !target.documentation && docStr) {
      newTarget.description = docStr;
    }

    const summaryStr = getSummary(program, cadlType);
    if (isString && !target.summary && summaryStr) {
      newTarget.summary = summaryStr;
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
    cadlType: ModelType,
    visibility: Visibility
  ): any | undefined {
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
      case "Map":
        // We assert on valType because Map types always have a type
        const valType = cadlType.properties.get("v");
        return {
          type: "object",
          additionalProperties: getSchemaOrRef(valType!.type, visibility),
        };
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
