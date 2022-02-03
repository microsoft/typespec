import {
  Program,
  setDecoratorNamespace,
  Type,
  validateDecoratorParamCount,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";

const headerFieldsKey = Symbol();
export function $header(program: Program, entity: Type, headerName?: string) {
  if (!headerName && entity.kind === "ModelProperty") {
    headerName = entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  program.stateMap(headerFieldsKey).set(entity, headerName);
}

export function getHeaderFieldName(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).get(entity);
}

export function isHeader(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).has(entity);
}

const queryFieldsKey = Symbol();
export function $query(program: Program, entity: Type, queryKey: string) {
  if (!queryKey && entity.kind === "ModelProperty") {
    queryKey = entity.name;
  }
  program.stateMap(queryFieldsKey).set(entity, queryKey);
}

export function getQueryParamName(program: Program, entity: Type) {
  return program.stateMap(queryFieldsKey).get(entity);
}

export function isQueryParam(program: Program, entity: Type) {
  return program.stateMap(queryFieldsKey).has(entity);
}

const pathFieldsKey = Symbol();
export function $path(program: Program, entity: Type, paramName: string) {
  if (!paramName && entity.kind === "ModelProperty") {
    paramName = entity.name;
  }
  program.stateMap(pathFieldsKey).set(entity, paramName);
}

export function getPathParamName(program: Program, entity: Type) {
  return program.stateMap(pathFieldsKey).get(entity);
}

export function isPathParam(program: Program, entity: Type) {
  return program.stateMap(pathFieldsKey).has(entity);
}

const bodyFieldsKey = Symbol();
export function $body(program: Program, entity: Type) {
  program.stateSet(bodyFieldsKey).add(entity);
}

export function isBody(program: Program, entity: Type): boolean {
  return program.stateSet(bodyFieldsKey).has(entity);
}

const statusCodeKey = Symbol();
export function $statusCode(program: Program, entity: Type) {
  if (entity.kind === "ModelProperty") {
    program.stateSet(statusCodeKey).add(entity);
  } else {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "statusCode", entityKind: entity.kind },
      target: entity,
    });
  }
}

export function isStatusCode(program: Program, entity: Type) {
  return program.stateSet(statusCodeKey).has(entity);
}

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";

const operationVerbsKey = Symbol();

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

export function $get(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "get");
}

export function $put(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "put");
}

export function $post(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "post");
}

export function $patch(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "patch");
}

export function $delete(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "delete");
}

export function $head(program: Program, entity: Type, ...args: unknown[]) {
  validateVerbNoArgs(program, entity, args);
  setOperationVerb(program, entity, "head");
}

// TODO: replace with built-in decorator validation https://github.com/Azure/cadl-azure/issues/1022
function validateVerbNoArgs(program: Program, target: Type, args: unknown[]) {
  validateDecoratorParamCount(program, target, args, 0);
}

setDecoratorNamespace(
  "Cadl.Http",
  $get,
  $put,
  $post,
  $delete,
  $patch,
  $header,
  $query,
  $path,
  $body,
  $statusCode
);

export function $plainData(program: Program, entity: Type) {
  if (entity.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      target: entity,
      format: { decorator: "plainData", entityKind: entity.kind },
    });
    return;
  }

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

setDecoratorNamespace("Cadl.Http.Private", $plainData);
