import {
  cadlTypeToJson,
  createDecoratorDefinition,
  createDiagnosticCollector,
  DecoratorContext,
  Diagnostic,
  DiagnosticTarget,
  getDoc,
  Model,
  ModelProperty,
  Namespace,
  Program,
  setCadlNamespace,
  Tuple,
  Type,
  Union,
  validateDecoratorParamCount,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { createDiagnostic, createStateSymbol, reportDiagnostic } from "../lib.js";
import { extractParamsFromPath } from "../utils.js";
import { AuthenticationOption, HttpAuth, ServiceAuthentication } from "./types.js";

export const namespace = "Cadl.Http";

const headerDecorator = createDecoratorDefinition({
  name: "@header",
  target: "ModelProperty",
  args: [{ kind: "String", optional: true }],
} as const);
const headerFieldsKey = createStateSymbol("header");
export function $header(context: DecoratorContext, entity: ModelProperty, headerName?: string) {
  if (!headerDecorator.validate(context, entity, [headerName])) {
    return;
  }

  if (!headerName) {
    headerName = entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  context.program.stateMap(headerFieldsKey).set(entity, headerName);
}

export function getHeaderFieldName(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).get(entity);
}

export function isHeader(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).has(entity);
}

const queryDecorator = createDecoratorDefinition({
  name: "@query",
  target: "ModelProperty",
  args: [{ kind: "String", optional: true }],
} as const);
const queryFieldsKey = createStateSymbol("query");
export function $query(context: DecoratorContext, entity: ModelProperty, queryKey?: string) {
  if (!queryDecorator.validate(context, entity, [queryKey])) {
    return;
  }

  if (!queryKey && entity.kind === "ModelProperty") {
    queryKey = entity.name;
  }
  context.program.stateMap(queryFieldsKey).set(entity, queryKey);
}

export function getQueryParamName(program: Program, entity: Type) {
  return program.stateMap(queryFieldsKey).get(entity);
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(queryFieldsKey).has(entity);
}

const pathDecorator = createDecoratorDefinition({
  name: "@path",
  target: "ModelProperty",
  args: [{ kind: "String", optional: true }],
} as const);
const pathFieldsKey = createStateSymbol("path");
export function $path(context: DecoratorContext, entity: ModelProperty, paramName?: string) {
  if (!pathDecorator.validate(context, entity, [paramName])) {
    return;
  }

  context.program.stateMap(pathFieldsKey).set(entity, paramName ?? entity.name);
}

export function getPathParamName(program: Program, entity: Type) {
  return program.stateMap(pathFieldsKey).get(entity);
}

export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(pathFieldsKey).has(entity);
}

const bodyDecorator = createDecoratorDefinition({
  name: "@body",
  target: "ModelProperty",
  args: [],
} as const);
const bodyFieldsKey = createStateSymbol("body");
export function $body(context: DecoratorContext, entity: ModelProperty) {
  if (!bodyDecorator.validate(context, entity, [])) {
    return;
  }
  context.program.stateSet(bodyFieldsKey).add(entity);
}

export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(bodyFieldsKey).has(entity);
}

const statusCodeDecorator = createDecoratorDefinition({
  name: "@statusCode",
  target: "ModelProperty",
  args: [],
} as const);
const statusCodeKey = createStateSymbol("statusCode");
export function $statusCode(context: DecoratorContext, entity: ModelProperty) {
  if (!statusCodeDecorator.validate(context, entity, [])) {
    return;
  }
  context.program.stateSet(statusCodeKey).add(entity);

  const codes: string[] = [];
  if (entity.type.kind === "String") {
    if (validStatusCode(context.program, entity.type.value, entity)) {
      codes.push(entity.type.value);
    }
  } else if (entity.type.kind === "Number") {
    if (validStatusCode(context.program, String(entity.type.value), entity)) {
      codes.push(String(entity.type.value));
    }
  } else if (entity.type.kind === "Union") {
    for (const option of entity.type.options) {
      if (option.kind === "String") {
        if (validStatusCode(context.program, option.value, option)) {
          codes.push(option.value);
        }
      } else if (option.kind === "Number") {
        if (validStatusCode(context.program, String(option.value), option)) {
          codes.push(String(option.value));
        }
      } else {
        reportDiagnostic(context.program, {
          code: "status-code-invalid",
          target: entity,
        });
      }
    }
  } else if (entity.type.kind === "TemplateParameter") {
    // Ignore template parameters
  } else {
    reportDiagnostic(context.program, {
      code: "status-code-invalid",
      target: entity,
    });
  }
  setStatusCode(context.program, entity, codes);
}

export function setStatusCode(program: Program, entity: Model | ModelProperty, codes: string[]) {
  program.stateMap(statusCodeKey).set(entity, codes);
}

// Check status code value: 3 digits with first digit in [1-5]
// Issue a diagnostic if not valid
function validStatusCode(program: Program, code: string, entity: Type): boolean {
  const statusCodePatten = /[1-5][0-9][0-9]/;
  if (code.match(statusCodePatten)) {
    return true;
  }
  reportDiagnostic(program, {
    code: "status-code-invalid",
    target: entity,
    messageId: "value",
  });
  return false;
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateMap(statusCodeKey).has(entity);
}

export function getStatusCodes(program: Program, entity: Type): string[] {
  return program.stateMap(statusCodeKey).get(entity) ?? [];
}

// Reference: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
export function getStatusCodeDescription(statusCode: string) {
  switch (statusCode) {
    case "200":
      return "The request has succeeded.";
    case "201":
      return "The request has succeeded and a new resource has been created as a result.";
    case "202":
      return "The request has been accepted for processing, but processing has not yet completed.";
    case "204":
      return "There is no content to send for this request, but the headers may be useful. ";
    case "301":
      return "The URL of the requested resource has been changed permanently. The new URL is given in the response.";
    case "304":
      return "The client has made a conditional request and the resource has not been modified.";
    case "400":
      return "The server could not understand the request due to invalid syntax.";
    case "401":
      return "Access is unauthorized.";
    case "403":
      return "Access is forbidden";
    case "404":
      return "The server cannot find the requested resource.";
    case "409":
      return "The request conflicts with the current state of the server.";
    case "412":
      return "Precondition failed.";
    case "503":
      return "Service unavailable.";
  }

  switch (statusCode.charAt(0)) {
    case "1":
      return "Informational";
    case "2":
      return "Successful";
    case "3":
      return "Redirection";
    case "4":
      return "Client Error";
    case "5":
      return "Server Error";
  }

  // Any valid HTTP status code is covered above.
  return undefined;
}

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";

const operationVerbsKey = createStateSymbol("verbs");

function setOperationVerb(program: Program, entity: Type, verb: HttpVerb): void {
  if (entity.kind === "Operation") {
    if (!program.stateMap(operationVerbsKey).has(entity)) {
      program.stateMap(operationVerbsKey).set(entity, verb);
    } else {
      reportDiagnostic(program, {
        code: "http-verb-duplicate",
        format: { entityName: entity.name },
        target: entity,
      });
    }
  } else {
    reportDiagnostic(program, {
      code: "http-verb-wrong-type",
      format: { verb, entityKind: entity.kind },
      target: entity,
    });
  }
}

export function getOperationVerb(program: Program, entity: Type): HttpVerb | undefined {
  return program.stateMap(operationVerbsKey).get(entity);
}

export function $get(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "get");
}

export function $put(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "put");
}

export function $post(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "post");
}

export function $patch(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "patch");
}

export function $delete(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "delete");
}

export function $head(context: DecoratorContext, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(context, args);
  setOperationVerb(context.program, entity, "head");
}

// TODO: replace with built-in decorator validation https://github.com/Azure/cadl-azure/issues/1022
function validateVerbNoArgs(context: DecoratorContext, args: unknown[]) {
  validateDecoratorParamCount(context, 0, 0, args);
}

export interface HttpServer {
  url: string;
  description: string;
  parameters: Map<string, ModelProperty>;
}

const serverDecoratorDefinition = createDecoratorDefinition({
  name: "@server",
  target: "Namespace",
  args: [{ kind: "String" }, { kind: "String" }, { kind: "Model", optional: true }],
} as const);
const serversKey = createStateSymbol("servers");
/**
 * Configure the server url for the service.
 * @param context Decorator context
 * @param target Decorator target(Must be a namespace)
 * @param description Description for this server.
 * @param parameters @optional Parameters to interpolate in the server url.
 */
export function $server(
  context: DecoratorContext,
  target: Namespace,
  url: string,
  description: string,
  parameters?: Model
): void {
  if (!serverDecoratorDefinition.validate(context, target, [url, description, parameters])) {
    return;
  }

  const params = extractParamsFromPath(url);
  const parameterMap = new Map(parameters?.properties ?? []);
  for (const declaredParam of params) {
    const param = parameterMap.get(declaredParam);
    if (!param) {
      reportDiagnostic(context.program, {
        code: "missing-server-param",
        format: { param: declaredParam },
        target: context.getArgumentTarget(0)!,
      });
      parameterMap.delete(declaredParam);
    }
  }

  let servers: HttpServer[] = context.program.stateMap(serversKey).get(target);
  if (servers === undefined) {
    servers = [];
    context.program.stateMap(serversKey).set(target, servers);
  }
  servers.push({
    url,
    description,
    parameters: parameterMap,
  });
}

export function getServers(program: Program, type: Namespace): HttpServer[] | undefined {
  return program.stateMap(serversKey).get(type);
}

export function $plainData(context: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(context, entity, "@plainData", "Model")) {
    return;
  }
  const { program } = context;

  const decoratorsToRemove = ["$header", "$body", "$query", "$path", "$statusCode"];
  const [headers, bodies, queries, paths, statusCodes] = [
    program.stateMap(headerFieldsKey),
    program.stateSet(bodyFieldsKey),
    program.stateMap(queryFieldsKey),
    program.stateMap(pathFieldsKey),
    program.stateMap(statusCodeKey),
  ];

  for (const property of entity.properties.values()) {
    // Remove the decorators so that they do not run in the future, for example,
    // if this model is later spread into another.
    property.decorators = property.decorators.filter(
      (d) => !decoratorsToRemove.includes(d.decorator.name)
    );

    // Remove the impact the decorators already had on this model.
    headers.delete(property);
    bodies.delete(property);
    queries.delete(property);
    paths.delete(property);
    statusCodes.delete(property);
  }
}

setCadlNamespace("Private", $plainData);

const useAuthDecorator = createDecoratorDefinition({
  name: "@useAuth",
  target: "Namespace",
  args: [{ kind: ["Model", "Union", "Tuple"] }],
} as const);
const authenticationKey = createStateSymbol("authentication");
export function $useAuth(
  context: DecoratorContext,
  serviceNamespace: Namespace,
  authConfig: Model | Union | Tuple
) {
  if (!useAuthDecorator.validate(context, serviceNamespace, [authConfig])) {
    return;
  }

  const [auth, diagnostics] = extractServiceAuthentication(context.program, authConfig);
  if (diagnostics.length > 0) context.program.reportDiagnostics(diagnostics);
  if (auth !== undefined) {
    setAuthentication(context.program, serviceNamespace, auth);
  }
}

export function setAuthentication(
  program: Program,
  serviceNamespace: Namespace,
  auth: ServiceAuthentication
) {
  program.stateMap(authenticationKey).set(serviceNamespace, auth);
}

function extractServiceAuthentication(
  program: Program,
  type: Model | Union | Tuple
): [ServiceAuthentication | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  switch (type.kind) {
    case "Model":
      const auth = diagnostics.pipe(extractHttpAuthentication(program, type, type));
      if (auth === undefined) return diagnostics.wrap(undefined);
      return diagnostics.wrap({ options: [{ schemes: [auth] }] });
    case "Tuple":
      const option = diagnostics.pipe(extractHttpAuthenticationOption(program, type, type));
      return diagnostics.wrap({ options: [option] });
    case "Union":
      return extractHttpAuthenticationOptions(program, type, type);
  }
}

function extractHttpAuthenticationOptions(
  program: Program,
  tuple: Union,
  diagnosticTarget: DiagnosticTarget
): [ServiceAuthentication, readonly Diagnostic[]] {
  const options: AuthenticationOption[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const value of tuple.options) {
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget)
        );
        if (result !== undefined) {
          options.push({ schemes: [result] });
        }
        break;
      case "Tuple":
        const option = diagnostics.pipe(
          extractHttpAuthenticationOption(program, value, diagnosticTarget)
        );
        options.push(option);
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: value.kind },
            target: value,
          })
        );
    }
  }
  return diagnostics.wrap({ options });
}

function extractHttpAuthenticationOption(
  program: Program,
  tuple: Tuple,
  diagnosticTarget: DiagnosticTarget
): [AuthenticationOption, readonly Diagnostic[]] {
  const schemes: HttpAuth[] = [];
  const diagnostics = createDiagnosticCollector();
  for (const value of tuple.values) {
    switch (value.kind) {
      case "Model":
        const result = diagnostics.pipe(
          extractHttpAuthentication(program, value, diagnosticTarget)
        );
        if (result !== undefined) {
          schemes.push(result);
        }
        break;
      default:
        diagnostics.add(
          createDiagnostic({
            code: "invalid-type-for-auth",
            format: { kind: value.kind },
            target: value,
          })
        );
    }
  }
  return diagnostics.wrap({ schemes });
}

function extractHttpAuthentication(
  program: Program,
  modelType: Model,
  diagnosticTarget: DiagnosticTarget
): [HttpAuth | undefined, readonly Diagnostic[]] {
  const [result, diagnostics] = cadlTypeToJson<HttpAuth>(modelType, diagnosticTarget);
  if (result === undefined) {
    return [result, diagnostics];
  }
  const description = getDoc(program, modelType);
  const auth = result.type === "oauth2" ? extractOAuth2Auth(result) : result;
  return [
    {
      ...auth,
      id: modelType.name || result.type,
      ...(description && { description }),
    },
    diagnostics,
  ];
}

function extractOAuth2Auth(data: any): HttpAuth {
  return {
    ...data,
    flows: data.flows.map((flow: any) => {
      return {
        ...flow,
        scopes: flow.scopes.map((x: string) => ({ value: x })),
      };
    }),
  };
}

export function getAuthentication(
  program: Program,
  namespace: Namespace
): ServiceAuthentication | undefined {
  return program.stateMap(authenticationKey).get(namespace);
}
