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

