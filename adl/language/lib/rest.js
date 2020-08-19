const basePaths = new WeakMap();
const responses = new WeakSet();

export function response(program, entity) {
  responses.add(entity);
}

export function resource(program, entity, basePath) {
  if (entity.kind !== 'Interface') return;
  basePaths.set(entity, basePath);
}

export function getResources() {
  return Array.from(basePath.keys());
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