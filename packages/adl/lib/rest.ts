import { Program } from "../compiler/program";
import { Type } from "../compiler/types";

const basePaths = new Map<Type, string>();

export function resource(program: Program, entity: Type, basePath = '') {
  if (entity.kind !== 'Interface') return;
  basePaths.set(entity, basePath);
}

export function getResources() {
  return Array.from(basePaths.keys());
}

export function isResource(obj: Type) {
  return basePaths.has(obj);
}

export function basePathForResource(resource: Type) {
  return basePaths.get(resource);
}

const headerFields = new Map<Type, string>();
export function header(program: Program, entity: Type, headerName: string) {
  if (!headerName && entity.kind === "ModelProperty") {
    headerName = entity.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  headerFields.set(entity, headerName);
}

export function getHeaderFieldName(entity: Type) {
  return headerFields.get(entity);
}

const queryFields = new Map<Type, string>();
export function query(program: Program, entity: Type, queryKey: string) {
  if (!queryKey && entity.kind === "ModelProperty") {
    queryKey = entity.name;
  }
  queryFields.set(entity, queryKey);
}

export function getQueryParamName(entity: Type) {
  return queryFields.get(entity);
}

const pathFields = new Map<Type, string>();
export function path(program: Program, entity: Type, paramName: string) {
  if (!paramName && entity.kind === "ModelProperty") {
    paramName = entity.name;
  }
  pathFields.set(entity, paramName);
}

export function getPathParamName(entity: Type) {
  return pathFields.get(entity);
}

const bodyFields = new Set<Type>();
export function body(program: Program, entity: Type) {
  bodyFields.add(entity);
}

export function isBody(entity: Type) {
  return bodyFields.has(entity);
}

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete";

const operationVerbs = new Map<Type, HttpVerb>();

function setOperationVerb(entity: Type, verb: HttpVerb) {
  if (entity.kind === "InterfaceProperty") {
    if (!operationVerbs.has(entity)) {
      operationVerbs.set(entity, verb);
    } else {
      throw new Error(`HTTP verb already applied to ${entity.name}`);
    }
  } else {
    throw new Error(`Cannot use @${verb} on a ${entity.kind}`);
  }
}

export function getOperationVerb(entity: Type): HttpVerb | undefined {
  return operationVerbs.get(entity);
}

export function get(program: Program, entity: Type) {
  setOperationVerb(entity, "get");
}

export function put(program: Program, entity: Type) {
  setOperationVerb(entity, "put");
}

export function post(program: Program, entity: Type) {
  setOperationVerb(entity, "post");
}

export function patch(program: Program, entity: Type) {
  setOperationVerb(entity, "patch");
}

// BUG #243: How do we deal with reserved words?
export function _delete(program: Program, entity: Type) {
  setOperationVerb(entity, "delete");
}
