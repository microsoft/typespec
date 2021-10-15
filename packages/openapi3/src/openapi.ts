import {
  ArrayType,
  EnumMemberType,
  EnumType,
  getAllTags,
  getDoc,
  getFormat,
  getMaxLength,
  getMinLength,
  getMinValue,
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
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import {
  basePathForResource,
  checkIfServiceNamespace,
  getHeaderFieldName,
  getOperationRoute,
  getPathParamName,
  getQueryParamName,
  getResources,
  getServiceHost,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  HttpVerb,
  isBody,
} from "@cadl-lang/rest";
import * as path from "path";
import { reportDiagnostic } from "./lib.js";

export async function $onBuild(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile: p.compilerOptions.swaggerOutputFile || path.resolve("./openapi.json"),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

const operationIdsKey = Symbol();
export function $operationId(program: Program, entity: Type, opId: string) {
  program.stateMap(operationIdsKey).set(entity, opId);
}

const pageableOperationsKey = Symbol();
export function $pageable(program: Program, entity: Type, nextLinkName: string = "nextLink") {
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
    servers: [
      {
        url: "https://" + getServiceHost(program),
      },
    ],
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
      for (let resource of getResources(program)) {
        if (resource.kind !== "Namespace") {
          reportDiagnostic(program, {
            code: "resource-namespace",
            target: resource,
          });
          continue;
        }

        emitResource(resource as NamespaceType);
      }
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
          path.resolve(options.outputFile),
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

  function emitResource(resource: NamespaceType): void {
    currentBasePath = basePathForResource(program, resource);

    for (const [name, op] of resource.operations) {
      emitEndpoint(resource, op);
    }
  }

  function getPathParameters(ns: NamespaceType, op: OperationType) {
    return [...(op.parameters?.properties.values() ?? [])].filter(
      (param) => getPathParamName(program, param) !== undefined
    );
  }

  /**
   * Translates endpoint names like `read` to REST verbs like `get`.
   */
  function pathForEndpoint(
    op: OperationType,
    pathParams: ModelTypeProperty[]
  ): [string, string[], string] {
    const paramByName = new Map(pathParams.map((p) => [p.name, p]));
    const route = getOperationRoute(program, op);
    const inferredVerb = verbForEndpoint(op.name);
    const verb = route?.verb || inferredVerb || "get";

    // Build the full route path including any sub-path
    const routePath =
      (currentBasePath || "") +
      (route?.subPath
        ? `/${route?.subPath?.replace(/^\//g, "")}`
        : !inferredVerb && !route
        ? "/get"
        : "");

    // Find path parameter names
    const declaredPathParamNames = routePath.match(/\{\w+\}/g)?.map((s) => s.slice(1, -1)) ?? [];

    // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
    // delete it because it doesn't need to be added to the path.
    for (const declaredParam of declaredPathParamNames) {
      const param = paramByName.get(declaredParam);
      if (!param) {
        reportDiagnostic(program, {
          code: "missing-path-param",
          format: { param: declaredParam },
          target: op,
        });
        continue;
      }

      paramByName.delete(declaredParam);
    }

    // Add any remaining declared path params
    const pathSegments = [];
    for (const name of paramByName.keys()) {
      pathSegments.push(name);
    }

    return [verb, pathSegments, routePath];
  }

  function verbForEndpoint(name: string): HttpVerb | undefined {
    switch (name) {
      case "list":
        return "get";
      case "create":
        return "post";
      case "read":
        return "get";
      case "update":
        return "patch";
      case "delete":
        return "delete";
      case "deleteAll":
        return "delete";
    }

    return undefined;
  }

  function emitEndpoint(resource: NamespaceType, op: OperationType) {
    const params = getPathParameters(resource, op);
    const [verb, newPathParams, resolvedPath] = pathForEndpoint(op, params);
    const fullPath =
      resolvedPath +
      (newPathParams.length > 0 ? "/" + newPathParams.map((p) => "{" + p + "}").join("/") : "");

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
      currentEndpoint.operationId = `${resource.name}_${op.name}`;
    }

    // allow operation extensions
    attachExtensions(op, currentEndpoint);
    currentEndpoint.summary = getDoc(program, op);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const currentTags = getAllTags(program, resource, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }

    emitEndpointParameters(op, op.parameters, [...(op.parameters?.properties.values() ?? [])]);
    emitRequestBody(op, op.parameters, [...(op.parameters?.properties.values() ?? [])]);
    emitResponses(op.returnType);
  }

  function emitResponses(responseType: Type) {
    if (responseType.kind === "Union") {
      for (const [i, option] of responseType.options.entries()) {
        emitResponseObject(option, i === 0 ? "200" : "default");
      }
    } else {
      emitResponseObject(responseType);
    }
  }

  function emitResponseObject(responseModel: Type, statusCode: string = "200") {
    if (
      responseModel.kind === "Model" &&
      !responseModel.baseModel &&
      responseModel.properties.size === 0
    ) {
      currentEndpoint.responses[204] = {
        description: "No content",
      };

      return;
    }

    let contentType = "application/json";
    let contentEntry: any = {};

    let bodyModel = responseModel;
    if (responseModel.kind === "Model") {
      for (const prop of responseModel.properties.values()) {
        if (isBody(program, prop)) {
          if (bodyModel !== responseModel) {
            reportDiagnostic(program, { code: "duplicate-body", target: responseModel });
            continue;
          }

          bodyModel = prop.type;
        }
        const type = prop.type;
        const headerName = getHeaderFieldName(program, prop);
        switch (headerName) {
          case undefined:
            break;
          case "status-code":
            if (type.kind === "Number") {
              statusCode = String(type.value);
            }
            break;
          case "content-type":
            if (type.kind === "String") {
              contentType = type.value;
            }
            break;
          default:
            const header = getResponseHeader(prop);
            contentEntry.headers = contentEntry.headers ?? {};
            contentEntry.headers[headerName] = header;
            break;
        }
      }
    }

    contentEntry.schema = getSchemaOrRef(bodyModel);

    const response: any = {
      description: getResponseDescription(responseModel, statusCode),
      content: {
        [contentType]: contentEntry,
      },
    };
    currentEndpoint.responses[statusCode] = response;
  }

  function getResponseDescription(responseModel: Type, statusCode: string) {
    const desc = getDoc(program, responseModel);
    if (desc) {
      return desc;
    }

    if (statusCode === "default") {
      return "An unexpected error response";
    }
    return "A successful response";
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
    methodParams: ModelTypeProperty[]
  ) {
    for (const param of methodParams) {
      // If param is a global parameter, just skip it
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }
      const queryInfo = getQueryParamName(program, param);
      const pathInfo = getPathParamName(program, param);
      const headerInfo = getHeaderFieldName(program, param);
      // Body parameters are handled elsewhere

      if (pathInfo) {
        emitParameter(parent, param, "path");
      } else if (queryInfo) {
        emitParameter(parent, param, "query");
      } else if (headerInfo) {
        if (headerInfo !== "content-type") {
          emitParameter(parent, param, "header");
        }
      }
    }
  }

  function emitRequestBody(
    op: OperationType,
    parent: ModelType | undefined,
    methodParams: ModelTypeProperty[]
  ) {
    const bodyParams = methodParams.filter((p) => isBody(program, p));
    if (bodyParams.length === 0) {
      return;
    }
    if (bodyParams.length > 1) {
      reportDiagnostic(program, { code: "duplicate-body", target: op });
    }
    const bodyParam = bodyParams[0];
    const bodyType = bodyParam.type;
    const bodySchema = getSchemaOrRef(bodyType);

    const requestBody: any = {
      description: getDoc(program, bodyParam),
      content: {},
    };

    const contentTypeParam = methodParams.find(
      (p) => getHeaderFieldName(program, p) === "content-type"
    );
    const contentTypes = contentTypeParam
      ? getContentTypes(contentTypeParam)
      : ["application/json"];
    for (let contentType of contentTypes) {
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
            messageId: "unionOfString",
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

    if (param.default) {
      ph.default = getDefaultValue(param.default);
    }

    // Apply decorators to a copy of the parameter definition.  We use
    // Object.assign here because applyIntrinsicDecorators returns a new object
    // based on the target object and we need to apply its changes back to the
    // original parameter.
    Object.assign(ph, applyIntrinsicDecorators(param, ph));

    let schema = getSchemaForType(param.type);
    if (param.type.kind === "Array") {
      schema.items = getSchemaForType(param.type.elementType);
    }
    ph.schema = schema;
  }

  function emitReferences() {
    for (const [property, param] of params) {
      const key = getParameterKey(property, param);

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

    function reportUnsupportedUnion() {
      reportDiagnostic(program, { code: "union-unsupported", target: e });
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
      default:
        reportUnsupportedUnion();
        return {};
    }

    const values = [];
    if (type === "model") {
      // Model unions can only ever be a model type with 'null'
      if (nonNullOptions.length === 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0]);

        return schema;
      } else {
        reportDiagnostic(program, {
          code: "union-unsupported",
          messageId: "null",
          target: union,
        });
        return {};
      }
    }

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

    return schema;

    function reportUnsupportedUnion() {
      reportDiagnostic(program, { code: "union-unsupported", target: union });
    }
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
    return !(headerInfo || queryInfo || pathInfo);
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
    const pattern = getFormat(program, cadlType);
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

    const maxValue = getMinValue(program, cadlType);
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
