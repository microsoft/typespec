import { Program } from "../compiler/program";
import { Type } from "../compiler/types";

const basePaths = new Map<Type, string>();

export function resource(program: Program, entity: Type, basePath = "") {
  if (entity.kind !== "Namespace") return;
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
    headerName = entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
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

interface OperationRoute {
  verb: HttpVerb;
  subPath?: string;
}

const operationRoutes = new Map<Type, OperationRoute>();

function setOperationRoute(entity: Type, verb: OperationRoute) {
  if (entity.kind === "Operation") {
    if (!operationRoutes.has(entity)) {
      operationRoutes.set(entity, verb);
    } else {
      throw new Error(`HTTP verb already applied to ${entity.name}`);
    }
  } else {
    throw new Error(`Cannot use @${verb} on a ${entity.kind}`);
  }
}

export function getOperationRoute(entity: Type): OperationRoute | undefined {
  return operationRoutes.get(entity);
}

export function get(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(entity, {
    verb: "get",
    subPath,
  });
}

export function put(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(entity, {
    verb: "put",
    subPath,
  });
}

export function post(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(entity, {
    verb: "post",
    subPath,
  });
}

export function patch(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(entity, {
    verb: "patch",
    subPath,
  });
}

// BUG #243: How do we deal with reserved words?
export function _delete(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(entity, {
    verb: "delete",
    subPath,
  });
}

// -- Service-level Metadata

let _serviceTitle: { type: Type; title: string } | undefined = undefined;

export function serviceTitle(program: Program, entity: Type, title: string) {
  if (_serviceTitle && _serviceTitle.type !== entity) {
    throw new Error("Service title can only be set once per ADL document.");
  }

  if (entity.kind !== "Namespace") {
    throw new Error("The @serviceTitle decorator can only be applied to namespaces.");
  }

  _serviceTitle = {
    type: entity,
    title,
  };
}

export function getServiceTitle(): string {
  return _serviceTitle ? _serviceTitle.title : "(title)";
}

let _serviceVersion: { type: Type; version: string } | undefined = undefined;

export function serviceVersion(program: Program, entity: Type, version: string) {
  // TODO: This will need to change once we support multiple service versions
  if (_serviceVersion && _serviceVersion.type !== entity) {
    throw new Error("Service version can only be set once per ADL document.");
  }

  if (entity.kind !== "Namespace") {
    throw new Error("The @serviceVersion decorator can only be applied to namespaces.");
  }

  _serviceVersion = {
    type: entity,
    version,
  };
}

export function getServiceVersion(): string {
  return _serviceVersion ? _serviceVersion.version : "0000-00-00";
}
