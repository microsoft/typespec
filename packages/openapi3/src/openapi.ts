import {
  ArrayType,
  checkIfServiceNamespace,
  EnumMemberType,
  EnumType,
  findChildModels,
  getAllTags,
  getDoc,
  getFormat,
  getMaxLength,
  getMaxValue,
  getMinLength,
  getMinValue,
  getPattern,
  getProperty,
  getServiceHost,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  getVisibility,
  isErrorType,
  isIntrinsic,
  isNumericType,
  isSecret,
  isStringType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  resolvePath,
  Type,
  UnionType,
  UnionTypeVariant,
} from "@cadl-lang/compiler";
import {
  getAllRoutes,
  getDiscriminator,
  http,
  HttpOperationParameter,
  HttpOperationParameters,
  OperationDetails,
} from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";

const { getHeaderFieldName, getPathParamName, getQueryParamName, isBody, isHeader, isStatusCode } =
  http;

export async function $onBuild(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile: p.compilerOptions.swaggerOutputFile || resolvePath("./openapi.json"),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

const operationIdsKey = Symbol();
export function $operationId(program: Program, entity: Type, opId: string) {
  if (entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "operationId", entityKind: entity.kind },
      target: entity,
    });
    return;
  }
  program.stateMap(operationIdsKey).set(entity, opId);
}

const pageableOperationsKey = Symbol();
export function $pageable(program: Program, entity: Type, nextLinkName: string = "nextLink") {
  if (entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "pageable", entityKind: entity.kind },
      target: entity,
    });
    return;
  }
  program.stateMap(pageableOperationsKey).set(entity, nextLinkName);
}

function getPageable(program: Program, entity: Type): string | undefined {
  return program.stateMap(pageableOperationsKey).get(entity);
}

const refTargetsKey = Symbol();

export function $useRef(program: Program, entity: Type, refUrl: string): void {
  if (entity.kind === "Model" || entity.kind === "ModelProperty") {
    program.stateMap(refTargetsKey).set(entity, refUrl);
  } else {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "modelsOperations",
      format: { decoratorName: "useRef" },
      target: entity,
    });
  }
}

function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = Symbol();
export function $oneOf(program: Program, entity: Type) {
  if (entity.kind !== "Union") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "oneOf", entityKind: entity.kind },
      target: entity,
    });
    return;
  }
  program.stateMap(oneOfKey).set(entity, true);
}

function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

// NOTE: These functions aren't meant to be used directly as decorators but as a
// helper functions for other decorators.  The security information given here
// will be inserted into the `security` and `securityDefinitions` sections of
// the emitted OpenAPI document.

const securityDetailsKey = Symbol();
const securityRequirementsKey = "requirements";
const securityDefinitionsKey = "definitions";

function getSecurityRequirements(program: Program) {
  const definitions = program.stateMap(securityDetailsKey);
  return definitions?.has(securityRequirementsKey) ? definitions.get(securityRequirementsKey) : [];
}

function setSecurityRequirements(program: Program, requirements: any[]) {
  program.stateMap(securityDetailsKey).set(securityRequirementsKey, requirements);
}

function getSecurityDefinitions(program: Program) {
  const definitions = program.stateMap(securityDetailsKey);
  return definitions?.has(securityDefinitionsKey) ? definitions.get(securityDefinitionsKey) : {};
}

function setSecurityDefinitions(program: Program, definitions: any) {
  program.stateMap(securityDetailsKey).set(securityDefinitionsKey, definitions);
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
  const requirements = getSecurityRequirements(program);
  requirements.push(req);
  setSecurityRequirements(program, requirements);
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

  const definitions = getSecurityDefinitions(program);
  definitions[name] = details;
  setSecurityDefinitions(program, definitions);
}

const openApiExtensions = new Map<Type, Map<string, any>>();
export function $extension(program: Program, entity: Type, extensionName: string, value: any) {
  let typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, value);
  openApiExtensions.set(entity, typeExtensions);
}

function getExtensions(entity: Type): Map<string, any> {
  return openApiExtensions.get(entity) ?? new Map<string, any>();
}

export interface OpenAPIEmitterOptions {
  outputFile: string;
}

function createOAPIEmitter(program: Program, options: OpenAPIEmitterOptions) {
  const root: any = {
    openapi: "3.0.0",
    info: {
      title: getServiceTitle(program),
      version: getServiceVersion(program),
    },
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

  const host = getServiceHost(program);
  if (host) {
    root.servers = [
      {
        url: "https://" + host,
      },
    ];
  }

  // Get the service namespace string for use in name shortening
  const serviceNamespace: string | undefined = getServiceNamespaceString(program);

  let currentBasePath: string | undefined = "";
  let currentPath: any = root.paths;
  let currentEndpoint: any;

  // Keep a list of all Types encountered that need schema definitions
  const schemas = new Set<Type>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/components/parameters. Inlined parameters do not go in
  // this map.
  const params = new Map<ModelTypeProperty, any>();

  // De-dupe the per-endpoint tags that will be added into the #/tags
  const tags = new Set<string>();

  return { emitOpenAPI };

  async function emitOpenAPI() {
    try {
      getAllRoutes(program).forEach(emitOperation);
      emitReferences();
      emitTags();

      // Clean up empty entries
      for (let elem of Object.keys(root.components)) {
        if (Object.keys(root.components[elem]).length === 0) {
          delete root.components[elem];
        }
      }

      if (!program.compilerOptions.noEmit && !program.hasError()) {
        // Write out the OpenAPI document to the output path
        await program.host.writeFile(
          resolvePath(options.outputFile),
          prettierOutput(JSON.stringify(root, null, 2))
        );
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

    if (program.stateMap(operationIdsKey).has(op)) {
      currentEndpoint.operationId = program.stateMap(operationIdsKey).get(op);
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = (groupName.length > 0 ? `${groupName}_` : "") + op.name;
    }

    // allow operation extensions
    attachExtensions(op, currentEndpoint);
    currentEndpoint.summary = getDoc(program, op);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const currentTags = getAllTags(program, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }

    emitEndpointParameters(op, op.parameters, parameters.parameters);
    emitRequestBody(op, op.parameters, parameters);
    emitResponses(op.returnType);
  }

  function emitResponses(responseType: Type) {
    if (responseType.kind === "Union") {
      for (const option of responseType.options) {
        emitResponseObject(option);
      }
    } else {
      emitResponseObject(responseType);
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

  function emitResponseObject(responseModel: Type) {
    // Get explicity defined status codes
    let statusCodes = getResponseStatusCodes(responseModel);

    // Get explicitly defined content types
    const contentTypes = getResponseContentTypes(responseModel);

    // Get response headers
    const headers = getResponseHeaders(responseModel);

    // Get explicitly defined body
    let bodyModel = getResponseBody(responseModel);

    // If there is no explicit body, it should be conjured from the return type
    // if it is a primitive type or it contains more than just response metadata
    if (!bodyModel) {
      if (responseModel.kind === "Model") {
        if (mapCadlTypeToOpenAPI(responseModel)) {
          bodyModel = responseModel;
        } else {
          const isResponseMetadata = (p: ModelTypeProperty) =>
            isHeader(program, p) || isStatusCode(program, p);
          const allProperties = (p: ModelType): ModelTypeProperty[] => {
            return [...p.properties.values(), ...(p.baseModel ? allProperties(p.baseModel) : [])];
          };
          if (allProperties(responseModel).some((p) => !isResponseMetadata(p))) {
            bodyModel = responseModel;
          }
        }
      } else {
        // body is array or possibly something else
        bodyModel = responseModel;
      }
    }

    // If there is no explicit status code, set the default
    if (statusCodes.length === 0) {
      const defaultStatusCode = bodyModel ? "200" : "204";
      statusCodes.push(defaultStatusCode);
    }

    // If there is a body but no explicit content types, use application/json
    if (bodyModel && contentTypes.length === 0) {
      contentTypes.push("application/json");
    }

    if (!bodyModel && contentTypes.length > 0) {
      reportDiagnostic(program, {
        code: "content-type-ignored",
        target: responseModel,
      });
    }

    // Assertion: bodyModel <=> contentTypes.length > 0

    // Put them into currentEndpoint.responses

    for (const statusCode of statusCodes) {
      if (currentEndpoint.responses[statusCode]) {
        reportDiagnostic(program, {
          code: "duplicate-response",
          format: { statusCode },
          target: responseModel,
        });
        continue;
      }
      const response: any = {
        description: getResponseDescription(responseModel, statusCode),
      };
      if (Object.keys(headers).length > 0) {
        response.headers = headers;
      }

      for (const contentType of contentTypes) {
        response.content ??= {};
        const isBinary = isBinaryPayload(bodyModel!, contentType);
        const schema = isBinary ? { type: "string", format: "binary" } : getSchemaOrRef(bodyModel!);
        response.content[contentType] = { schema };
      }
      currentEndpoint.responses[statusCode] = response;
    }
  }

  // Get explicity defined status codes from response Model
  // Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
  // We do not check for duplicates here -- that will be done by the caller.
  function getResponseStatusCodes(responseModel: Type): string[] {
    const codes: string[] = [];
    if (responseModel.kind === "Model") {
      if (responseModel.baseModel) {
        codes.push(...getResponseStatusCodes(responseModel.baseModel));
      }
      for (const prop of responseModel.properties.values()) {
        if (isStatusCode(program, prop)) {
          if (prop.type.kind === "String") {
            if (validStatusCode(prop.type.value, prop)) {
              codes.push(prop.type.value);
            }
          } else if (prop.type.kind === "Number") {
            if (validStatusCode(String(prop.type.value), prop)) {
              codes.push(String(prop.type.value));
            }
          } else if (prop.type.kind === "Union") {
            for (const option of prop.type.options) {
              if (option.kind === "String") {
                if (validStatusCode(option.value, option)) {
                  codes.push(option.value);
                }
              } else if (option.kind === "Number") {
                if (validStatusCode(String(option.value), option)) {
                  codes.push(String(option.value));
                }
              } else {
                reportDiagnostic(program, { code: "status-code-invalid", target: prop });
              }
            }
          } else {
            reportDiagnostic(program, { code: "status-code-invalid", target: prop });
          }
        }
      }
    }
    return codes;
  }

  // Check status code value: 3 digits, 1 digit + "XX", or default
  // Issue a diagnostic if not valid
  function validStatusCode(code: string, entity: Type): boolean {
    // regex for three character status codes:
    // - starts with 1-5
    // - last two digits are numeric or "X"
    const statusCodePatten = /[1-5][-09X][0-9X]/;
    if (code.match(statusCodePatten) || code === "default") {
      return true;
    }
    reportDiagnostic(program, {
      code: "status-code-invalid",
      target: entity,
      messageId: "value",
    });
    return false;
  }

  // Note: these descriptions come from https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
  function getDescriptionForStatusCode(statusCode: string) {
    switch (statusCode) {
      case "2XX":
        return "Successful";
      case "200":
        return "Ok";
      case "201":
        "Created";
      case "202":
        return "Accepted";
      case "204":
        return "No Content";
      case "3XX":
        return "Redirection";
      case "4XX":
        return "Client Error";
      case "400":
        return "Bad Request";
      case "401":
        return "Unauthorized";
      case "403":
        return "Forbidden";
      case "404":
        return "Not Found";
      case "5XX":
        return "Server Error";
      case "default":
        return "An unexpected error response";
    }
    // We might want to throw here -- rather than giving some default
    return "A successful response";
  }

  function getResponseDescription(responseModel: Type, statusCode: string) {
    const desc = getDoc(program, responseModel);
    if (desc) {
      return desc;
    }

    // We might want to throw here -- rather than giving some default
    return getDescriptionForStatusCode(statusCode);
  }

  // Get explicity defined content-types from response Model
  // Return is an array of strings, possibly empty, which indicates no explicitly defined content-type.
  // We do not check for duplicates here -- that will be done by the caller.
  function getResponseContentTypes(responseModel: Type): string[] {
    const contentTypes: string[] = [];
    if (responseModel.kind === "Model") {
      if (responseModel.baseModel) {
        contentTypes.push(...getResponseContentTypes(responseModel.baseModel));
      }
      for (const prop of responseModel.properties.values()) {
        if (isHeader(program, prop) && getHeaderFieldName(program, prop) === "content-type") {
          contentTypes.push(...getContentTypes(prop));
        }
      }
    }
    return contentTypes;
  }

  // Get response headers from response Model
  function getResponseHeaders(responseModel: Type) {
    if (responseModel.kind === "Model") {
      const responseHeaders: any = responseModel.baseModel
        ? getResponseHeaders(responseModel.baseModel)
        : {};
      for (const prop of responseModel.properties.values()) {
        const headerName = getHeaderFieldName(program, prop);
        if (isHeader(program, prop) && headerName !== "content-type") {
          responseHeaders[headerName] = getResponseHeader(prop);
        }
      }
      return responseHeaders;
    }
    return {};
  }

  // Get explicity defined response body from response Model
  // The "outermost" body is used -- so we only look at basemodel if no body is defined
  function getResponseBody(responseModel: Type): Type | undefined {
    if (responseModel.kind === "Model") {
      const bodyProps = [...responseModel.properties.values()].filter((t) => isBody(program, t));
      if (bodyProps.length === 0) {
        return responseModel.baseModel ? getResponseBody(responseModel.baseModel) : undefined;
      }
      // Report all but first body as duplicate
      for (const prop of bodyProps.slice(1)) {
        reportDiagnostic(program, { code: "duplicate-body", target: prop });
      }
      return bodyProps[0].type;
    }
    return undefined;
  }

  function getResponseHeader(prop: ModelTypeProperty) {
    const header: any = {};
    populateParameter(header, prop, undefined);
    delete header.in;
    delete header.name;
    delete header.required;
    return header;
  }

  function getSchemaOrRef(type: Type): any {
    const refUrl = getRef(program, type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (type.kind === "Model" && !type.baseModel) {
      // If this is a model that isn't derived from anything, there's a chance
      // it's a base Cadl "primitive" that corresponds directly to an OpenAPI
      // primitive. In such cases, we don't want to emit a ref and instead just
      // emit the base type directly.
      const builtIn = mapCadlTypeToOpenAPI(type);
      if (builtIn !== undefined) {
        return builtIn;
      }
    }

    if (type.kind === "String" || type.kind === "Number" || type.kind === "Boolean") {
      // For literal types, we just want to emit them directly as well.
      return mapCadlTypeToOpenAPI(type);
    }
    const name = getTypeNameForSchemaProperties(type);
    if (!isRefSafeName(name)) {
      // Schema's name is not reference-able in OpenAPI so we inline it.
      // This will usually happen with instantiated/anonymous types, but could also
      // happen if Cadl identifier uses characters that are problematic for OpenAPI.
      // Users will have to rename / alias type to have it get ref'ed.
      const schema = getSchemaForType(type);

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
      const placeholder = {
        $ref: "#/components/schemas/" + name,
      };
      schemas.add(type);
      return placeholder;
    }
  }

  function getParamPlaceholder(parent: ModelType | undefined, property: ModelTypeProperty) {
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
    // only parameters inherited by spreading or from interface are shared in #/parameters
    // bt: not sure about the interface part of this comment?

    if (spreadParam) {
      params.set(property, placeholder);
    }

    return placeholder;
  }

  function emitEndpointParameters(
    op: OperationType,
    parent: ModelType | undefined,
    parameters: HttpOperationParameter[]
  ) {
    for (const { type, name, param } of parameters) {
      // If param is a global parameter, just skip it
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }

      switch (type) {
        case "path":
          emitParameter(parent, param, "path");
          break;
        case "query":
          emitParameter(parent, param, "query");
          break;
        case "header":
          if (name !== "content-type") {
            emitParameter(parent, param, "header");
          }
          break;
      }
    }
  }

  function emitRequestBody(
    op: OperationType,
    parent: ModelType | undefined,
    parameters: HttpOperationParameters
  ) {
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
      ? getContentTypes(contentTypeParam.param)
      : ["application/json"];
    for (let contentType of contentTypes) {
      const isBinary = isBinaryPayload(bodyType, contentType);
      const bodySchema = isBinary ? { type: "string", format: "binary" } : getSchemaOrRef(bodyType);
      const contentEntry: any = {
        schema: bodySchema,
      };
      requestBody.content[contentType] = contentEntry;
    }

    currentEndpoint.requestBody = requestBody;
  }

  function getContentTypes(param: ModelTypeProperty): string[] {
    if (param.type.kind === "String") {
      return [param.type.value];
    } else if (param.type.kind === "Union") {
      const contentTypes = [];
      for (const option of param.type.options) {
        if (option.kind === "String") {
          contentTypes.push(option.value);
        } else {
          reportDiagnostic(program, {
            code: "content-type-string",
            target: param,
          });
          continue;
        }
      }

      return contentTypes;
    }

    reportDiagnostic(program, { code: "content-type-string", target: param });

    return [];
  }

  function getModelTypeIfNullable(type: Type): ModelType | undefined {
    if (type.kind === "Model") {
      return type;
    } else if (type.kind === "Union") {
      // Remove all `null` types and make sure there's a single model type
      const nonNulls = type.options.filter((o) => !isNullType(o));
      if (nonNulls.every((t) => t.kind === "Model")) {
        return nonNulls.length === 1 ? (nonNulls[0] as ModelType) : undefined;
      }
    }

    return undefined;
  }

  function emitParameter(parent: ModelType | undefined, param: ModelTypeProperty, kind: string) {
    const ph = getParamPlaceholder(parent, param);
    currentEndpoint.parameters.push(ph);

    // If the parameter already has a $ref, don't bother populating it
    if (!("$ref" in ph)) {
      populateParameter(ph, param, kind);
    }
  }

  function populateParameter(ph: any, param: ModelTypeProperty, kind: string | undefined) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(program, param);

    // Apply decorators to the schema for the parameter.
    let schema = applyIntrinsicDecorators(param, getSchemaForType(param.type));
    if (param.type.kind === "Array") {
      schema.items = getSchemaForType(param.type.elementType);
    }
    if (param.default) {
      schema.default = getDefaultValue(param.default);
    }
    attachExtensions(param, ph);
    ph.schema = schema;
  }

  function emitReferences() {
    for (const [property, param] of params) {
      const key = getParameterKey(property, param);

      root.components.parameters[key] = { ...param };

      for (const key of Object.keys(param)) {
        delete param[key];
      }

      param["$ref"] = "#/components/parameters/" + key;
    }

    for (const type of schemas) {
      const name = getTypeNameForSchemaProperties(type);
      const schemaForType = getSchemaForType(type);
      if (schemaForType) {
        root.components.schemas[name] = schemaForType;
      }
    }
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags.push({ name: tag });
    }
  }

  function getParameterKey(property: ModelTypeProperty, param: any) {
    const parent = program.checker!.getTypeForNode(property.node.parent!) as ModelType;
    let key = program.checker!.getTypeName(parent);
    if (parent.properties.size > 1) {
      key += `.${property.name}`;
    }

    // Try to shorten the type name to exclude the top-level service namespace
    let baseKey = getRefSafeName(key);
    if (serviceNamespace && key.startsWith(serviceNamespace)) {
      baseKey = key.substring(serviceNamespace.length + 1);

      // If no parameter exists with the shortened name, use it, otherwise use the fully-qualified name
      if (root.components.parameters[baseKey] === undefined) {
        key = baseKey;
      }
    }

    return key;
  }

  function getSchemaForType(type: Type) {
    const builtinType = mapCadlTypeToOpenAPI(type);
    if (builtinType !== undefined) return builtinType;

    if (type.kind === "Array") {
      return getSchemaForArray(type);
    } else if (type.kind === "Model") {
      return getSchemaForModel(type);
    } else if (type.kind === "Union") {
      return getSchemaForUnion(type);
    } else if (type.kind === "UnionVariant") {
      return getSchemaForUnionVariant(type);
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

      values.push(option.value ? option.value : option.name);
    }

    const schema: any = { type, description: getDoc(program, e) };
    if (values.length > 0) {
      schema.enum = values;
    }

    return schema;
    function enumMemberType(member: EnumMemberType) {
      if (!member.value || typeof member.value === "string") return "string";
      return "number";
    }

    function reportUnsupportedUnion(messageId: "default" | "empty" = "default") {
      reportDiagnostic(program, { code: "union-unsupported", messageId, target: e });
    }
  }

  function getSchemaForUnion(union: UnionType) {
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
        const schema: any = getSchemaForType(nonNullOptions[0]);
        if (nullable) {
          schema["nullable"] = true;
        }

        return schema;
      } else {
        const variants = nonNullOptions.map((s) => getSchemaOrRef(s));
        const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
        const schema: any = { [ofType]: nonNullOptions.map((s) => getSchemaOrRef(s)) };
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

  function getSchemaForUnionVariant(variant: UnionTypeVariant) {
    const schema: any = getSchemaForType(variant.type);
    return schema;
  }

  function getSchemaForArray(array: ArrayType) {
    const target = array.elementType;

    return {
      type: "array",
      items: getSchemaOrRef(target),
    };
  }

  function isNullType(type: Type): boolean {
    return type.kind === "Model" && type.name === "null" && isIntrinsic(program, type);
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

  function getSchemaForModel(model: ModelType) {
    let modelSchema: any = {
      type: "object",
      properties: {},
      description: getDoc(program, model),
    };

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      const childModels = findChildModels(program, model);

      if (!validateDiscriminator(discriminator, childModels)) {
        // appropriate diagnostic is generated with the validate function
        return {};
      }

      // getSchemaOrRef on all children to push them into components.schemas
      for (let child of childModels) {
        getSchemaOrRef(child);
      }

      const mapping = getDiscriminatorMapping(discriminator, childModels);
      if (mapping) {
        discriminator.mapping = mapping;
      }

      modelSchema.discriminator = discriminator;
    }

    for (const [name, prop] of model.properties) {
      if (!isSchemaProperty(prop)) {
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
      modelSchema.properties[name] = applyIntrinsicDecorators(prop, getSchemaOrRef(prop.type));
      if (description) {
        modelSchema.properties[name].description = description;
      }

      if (prop.default) {
        modelSchema.properties[name].default = getDefaultValue(prop.default);
      }

      // Should the property be marked as readOnly?
      const vis = getVisibility(program, prop);
      if (vis && vis.includes("read") && vis.length == 1) {
        modelSchema.properties[name].readOnly = true;
      }

      // Attach any additional OpenAPI extensions
      attachExtensions(prop, modelSchema.properties[name]);
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
      const baseSchema = getSchemaForType(model.baseModel);
      modelSchema = {
        ...baseSchema,
        description: modelSchema.description,
      };
    } else if (model.baseModel) {
      modelSchema.allOf = [getSchemaOrRef(model.baseModel)];
    }

    // Attach any OpenAPI extensions
    attachExtensions(model, modelSchema);
    return modelSchema;
  }

  function attachExtensions(type: Type, emitObject: any) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  function validateDiscriminator(discriminator: any, childModels: ModelType[]): boolean {
    const { propertyName } = discriminator;
    var retVals = childModels.map((t) => {
      const prop = getProperty(t, propertyName);
      if (!prop) {
        reportDiagnostic(program, { code: "discriminator", messageId: "missing", target: t });
        return false;
      }
      var retval = true;
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
    for (let t of childModels) {
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

  function getDiscriminatorMapping(discriminator: any, childModels: ModelType[]) {
    const { propertyName } = discriminator;
    const getMapping = (t: ModelType): any => {
      const prop = t.properties?.get(propertyName);
      if (prop) {
        return getStringValues(prop.type).flatMap((v) => [{ [v]: getSchemaOrRef(t).$ref }]);
      }
      return undefined;
    };
    var mappings = childModels.flatMap(getMapping).filter((v) => v); // only defined values
    return mappings.length > 0 ? mappings.reduce((a, s) => ({ ...a, ...s }), {}) : undefined;
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

  /**
   * A "schema property" here is a property that is emitted to OpenAPI schema.
   *
   * Headers, parameters, status codes are not schema properties even they are
   * represented as properties in Cadl.
   */
  function isSchemaProperty(property: ModelTypeProperty) {
    const headerInfo = getHeaderFieldName(program, property);
    const queryInfo = getQueryParamName(program, property);
    const pathInfo = getPathParamName(program, property);
    const statusCodeinfo = isStatusCode(program, property);
    return !(headerInfo || queryInfo || pathInfo || statusCodeinfo);
  }

  function getTypeNameForSchemaProperties(type: Type) {
    // Try to shorten the type name to exclude the top-level service namespace
    let typeName = program!.checker!.getTypeName(type).replace(/<([\w\.]+)>/, "_$1");

    if (isRefSafeName(typeName)) {
      if (serviceNamespace) {
        typeName = typeName.replace(RegExp(serviceNamespace + "\\.", "g"), "");
      }
      // exclude the Cadl namespace in type names
      typeName = typeName.replace(/($|_)(Cadl\.)/g, "$1");
    }

    return typeName;
  }

  function hasSchemaProperties(properties: Map<string, ModelTypeProperty>) {
    for (const property of properties.values()) {
      if (isSchemaProperty(property)) {
        return true;
      }
    }
    return false;
  }

  function applyIntrinsicDecorators(cadlType: Type, target: any): any {
    const formatStr = getFormat(program, cadlType);
    if (isStringType(program, cadlType) && !target.format && formatStr) {
      target = {
        ...target,
        format: formatStr,
      };
    }

    const pattern = getPattern(program, cadlType);
    if (isStringType(program, cadlType) && !target.pattern && pattern) {
      target = {
        ...target,
        pattern,
      };
    }

    const minLength = getMinLength(program, cadlType);
    if (isStringType(program, cadlType) && !target.minLength && minLength !== undefined) {
      target = {
        ...target,
        minLength,
      };
    }

    const maxLength = getMaxLength(program, cadlType);
    if (isStringType(program, cadlType) && !target.maxLength && maxLength !== undefined) {
      target = {
        ...target,
        maxLength,
      };
    }

    const minValue = getMinValue(program, cadlType);
    if (isNumericType(program, cadlType) && !target.minimum && minValue !== undefined) {
      target = {
        ...target,
        minimum: minValue,
      };
    }

    const maxValue = getMaxValue(program, cadlType);
    if (isNumericType(program, cadlType) && !target.maximum && maxValue !== undefined) {
      target = {
        ...target,
        maximum: maxValue,
      };
    }

    if (isSecret(program, cadlType)) {
      target = {
        ...target,
        format: "password",
      };
    }

    return target;
  }

  // Map an Cadl type to an OA schema. Returns undefined when the resulting
  // OA schema is just a regular object schema.
  function mapCadlTypeToOpenAPI(cadlType: Type): any {
    switch (cadlType.kind) {
      case "Number":
        return { type: "number", enum: [cadlType.value] };
      case "String":
        return { type: "string", enum: [cadlType.value] };
      case "Boolean":
        return { type: "boolean", enum: [cadlType.value] };
      case "Model":
        switch (cadlType.name) {
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
              additionalProperties: getSchemaOrRef(valType!.type),
            };
        }
    }
    // The base model doesn't correspond to a primitive OA type, but it could
    // derive from one. Let's check.
    if (cadlType.kind === "Model" && cadlType.baseModel) {
      const baseSchema = mapCadlTypeToOpenAPI(cadlType.baseModel);
      if (baseSchema) {
        return applyIntrinsicDecorators(cadlType, baseSchema);
      }
    }
  }
}

function isRefSafeName(name: string) {
  return /^[A-Za-z0-9-_.]+$/.test(name);
}

function getRefSafeName(name: string) {
  return name.replace(/^[A-Za-z0-9-_.]/g, "_");
}

function prettierOutput(output: string) {
  return output + "\n";
}

class ErrorTypeFoundError extends Error {
  constructor() {
    super("Error type found in evaluated Cadl output");
  }
}
