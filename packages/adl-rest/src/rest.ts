import { NamespaceType, OperationType, Program, throwDiagnostic, Type } from "@azure-tools/adl";

const basePaths = new Map<Type, string>();

export interface HttpOperationType extends OperationType {
    basePath: string,
    route: OperationRoute
}

export function getHttpOperation(operation: OperationType) : HttpOperationType | undefined {
  if (!isResource(operation)) {
    return undefined;
  }
   return {
     basePath: basePathForResource(operation)!,
     route: getOperationRoute(operation)!,
     kind: operation.kind,
     name: operation.name,
     node: operation.node,
     returnType: operation.returnType,
     namespace: operation.namespace,
     parameters: operation.parameters
   };
}

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

export function isQueryParam(entity: Type) {
  return queryFields.has(entity);
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

export function isPathParam(entity: Type) {
  return pathFields.has(entity);
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
      throwDiagnostic(`HTTP verb already applied to ${entity.name}`, entity);
    }
  } else {
    throwDiagnostic(`Cannot use @${verb} on a ${entity.kind}`, entity);
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

const serviceDetails: {
  namespace?: NamespaceType;
  title?: string;
  version?: string;
} = {};

export function _setServiceNamespace(namespace: NamespaceType): void {
  if (serviceDetails.namespace && serviceDetails.namespace !== namespace) {
    throwDiagnostic("Cannot set service namespace more than once in an ADL project.", namespace);
  }

  serviceDetails.namespace = namespace;
}

export function _checkIfServiceNamespace(namespace: NamespaceType): boolean {
  return serviceDetails.namespace === namespace;
}

export function serviceTitle(program: Program, entity: Type, title: string) {
  if (serviceDetails.title) {
    throwDiagnostic("Service title can only be set once per ADL document.", entity);
  }

  if (entity.kind !== "Namespace") {
    throwDiagnostic("The @serviceTitle decorator can only be applied to namespaces.", entity);
  }

  _setServiceNamespace(entity);
  serviceDetails.title = title;
}

export function getServiceTitle(): string {
  return serviceDetails.title || "(title)";
}

export function serviceVersion(program: Program, entity: Type, version: string) {
  // TODO: This will need to change once we support multiple service versions
  if (serviceDetails.version) {
    throwDiagnostic("Service version can only be set once per ADL document.", entity);
  }

  if (entity.kind !== "Namespace") {
    throwDiagnostic("The @serviceVersion decorator can only be applied to namespaces.", entity);
  }

  _setServiceNamespace(entity);
  serviceDetails.version = version;
}

export function getServiceVersion(): string {
  return serviceDetails.version || "0000-00-00";
}

export function getServiceNamespaceString(program: Program): string | undefined {
  return (
    (serviceDetails.namespace && program.checker!.getNamespaceString(serviceDetails.namespace)) ||
    undefined
  );
}

const producesTypes = new Map<Type, string[]>();

export function produces(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    throwDiagnostic("The @produces decorator can only be applied to namespaces.", entity);
  }

  const values = getProduces(entity);
  producesTypes.set(entity, values.concat(contentTypes));
}

export function getProduces(entity: Type): string[] {
  return producesTypes.get(entity) || [];
}

const consumesTypes = new Map<Type, string[]>();

export function consumes(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    throwDiagnostic("The @consumes decorator can only be applied to namespaces.", entity);
  }

  const values = getConsumes(entity);
  consumesTypes.set(entity, values.concat(contentTypes));
}

export function getConsumes(entity: Type): string[] {
  return consumesTypes.get(entity) || [];
}
