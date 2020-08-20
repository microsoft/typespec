const basePaths = new Map();
const responses = new Set();

export function response(program, entity) {
  responses.add(entity);
}

export function resource(program, entity, basePath) {
  if (entity.kind !== 'Interface') return;
  basePaths.set(entity, basePath);
}

export function getResources() {
  return Array.from(basePaths.keys());
}

export function isResource(obj) {
  return resources.includes(obj);
}

export function isResponse(obj) {
  return responses.has(obj);
}

export function basePathForResource(resource) {
  return basePaths.get(resource);
}

const headerFields = new Map();
export function header(program, entity, headerName = entity.name) {
  headerFields.set(entity, headerName);
}

export function getHeaderFieldName(entity) {
  return headerFields.get(entity);
}

const queryFields = new Map();
export function query(program, entity, queryKey = entity.name) {
  console.log("@QUERY!", entity.name);
  queryFields.set(entity, queryKey);
}

export function getQueryParamName(entity) {
  return queryFields.get(entity);
}


const pathFields = new Map();
export function path(program, entity, paramName = entity.name) {
  pathFields.set(entity, paramName);
}

export function getPathParamName(entity) {
  pathFields.get(entity);
}

const bodyFields = new Set();
export function body(program, entity) {
  bodyFields.add(entity);
}

export function isBody(entity) {
  return bodyFields.has(entity)
}