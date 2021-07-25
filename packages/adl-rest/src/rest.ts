import { NamespaceType, OperationType, Program, Type } from "@azure-tools/adl";

const basePathsKey = Symbol();
export interface HttpOperationType extends OperationType {
  basePath: string;
  route: OperationRoute;
}

export function getHttpOperation(
  program: Program,
  operation: OperationType
): HttpOperationType | undefined {
  if (!operation.namespace || !isResource(program, operation.namespace!)) {
    return undefined;
  }
  return {
    basePath: basePathForResource(program, operation)!,
    route: getOperationRoute(program, operation)!,
    kind: operation.kind,
    name: operation.name,
    node: operation.node,
    returnType: operation.returnType,
    namespace: operation.namespace,
    parameters: operation.parameters,
  };
}

export function resource(program: Program, entity: Type, basePath = "") {
  if (entity.kind !== "Namespace") return;
  program.stateMap(basePathsKey).set(entity, basePath);
}

export function getResources(program: Program) {
  return Array.from(program.stateMap(basePathsKey).keys());
}

export function isResource(program: Program, obj: Type) {
  return program.stateMap(basePathsKey).has(obj);
}

export function basePathForResource(program: Program, resource: Type) {
  return program.stateMap(basePathsKey).get(resource);
}

const headerFieldsKey = Symbol();
export function header(program: Program, entity: Type, headerName: string) {
  if (!headerName && entity.kind === "ModelProperty") {
    headerName = entity.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
  program.stateMap(headerFieldsKey).set(entity, headerName);
}

export function getHeaderFieldName(program: Program, entity: Type) {
  return program.stateMap(headerFieldsKey).get(entity);
}

const queryFieldsKey = Symbol();
export function query(program: Program, entity: Type, queryKey: string) {
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
export function path(program: Program, entity: Type, paramName: string) {
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
export function body(program: Program, entity: Type) {
  program.stateSet(bodyFieldsKey).add(entity);
}

export function isBody(program: Program, entity: Type) {
  return program.stateSet(bodyFieldsKey).has(entity);
}

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete";

interface OperationRoute {
  verb: HttpVerb;
  subPath?: string;
}

const operationRoutesKey = Symbol();

function setOperationRoute(program: Program, entity: Type, verb: OperationRoute) {
  if (entity.kind === "Operation") {
    if (!program.stateMap(operationRoutesKey).has(entity)) {
      program.stateMap(operationRoutesKey).set(entity, verb);
    } else {
      program.reportDiagnostic(`HTTP verb already applied to ${entity.name}`, entity);
    }
  } else {
    program.reportDiagnostic(`Cannot use @${verb} on a ${entity.kind}`, entity);
  }
}

export function getOperationRoute(program: Program, entity: Type): OperationRoute | undefined {
  return program.stateMap(operationRoutesKey).get(entity);
}

export function get(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "get",
    subPath,
  });
}

export function put(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "put",
    subPath,
  });
}

export function post(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "post",
    subPath,
  });
}

export function patch(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "patch",
    subPath,
  });
}

// BUG #243: How do we deal with reserved words?
export function _delete(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "delete",
    subPath,
  });
}

// -- Service-level Metadata

interface ServiceDetails {
  namespace?: NamespaceType;
  title?: string;
  version?: string;
  host?: string;
}

const programServiceDetails = new WeakMap<Program, ServiceDetails>();
function getServiceDetails(program: Program) {
  let serviceDetails = programServiceDetails.get(program);
  if (!serviceDetails) {
    serviceDetails = {};
    programServiceDetails.set(program, serviceDetails);
  }

  return serviceDetails;
}

export function _setServiceNamespace(program: Program, namespace: NamespaceType): void {
  const serviceDetails = getServiceDetails(program);
  if (serviceDetails.namespace && serviceDetails.namespace !== namespace) {
    program.reportDiagnostic(
      "Cannot set service namespace more than once in an ADL project.",
      namespace
    );
  }

  serviceDetails.namespace = namespace;
}

export function _checkIfServiceNamespace(program: Program, namespace: NamespaceType): boolean {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.namespace === namespace;
}

export function serviceTitle(program: Program, entity: Type, title: string) {
  const serviceDetails = getServiceDetails(program);
  if (serviceDetails.title) {
    program.reportDiagnostic("Service title can only be set once per ADL document.", entity);
  }

  if (entity.kind !== "Namespace") {
    program.reportDiagnostic(
      "The @serviceTitle decorator can only be applied to namespaces.",
      entity
    );
    return;
  }

  _setServiceNamespace(program, entity);
  serviceDetails.title = title;
}

export function getServiceTitle(program: Program): string {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.title || "(title)";
}

export function serviceHost(program: Program, entity: Type, host: string) {
  const serviceDetails = getServiceDetails(program);
  if (serviceDetails.host) {
    program.reportDiagnostic("Service host can only be set once per ADL document.", entity);
    return;
  }

  if (entity.kind !== "Namespace") {
    program.reportDiagnostic(
      "The @serviceHost decorator can only be applied to namespaces.",
      entity
    );
    return;
  }

  _setServiceNamespace(program, entity);
  serviceDetails.host = host;
}

export function getServiceHost(program: Program): string {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.host || "management.azure.com";
}

export function serviceVersion(program: Program, entity: Type, version: string) {
  const serviceDetails = getServiceDetails(program);
  // TODO: This will need to change once we support multiple service versions
  if (serviceDetails.version) {
    program.reportDiagnostic("Service version can only be set once per ADL document.", entity);
  }

  if (entity.kind !== "Namespace") {
    program.reportDiagnostic(
      "The @serviceVersion decorator can only be applied to namespaces.",
      entity
    );
    return;
  }

  _setServiceNamespace(program, entity);
  serviceDetails.version = version;
}

export function getServiceVersion(program: Program): string {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.version || "0000-00-00";
}

export function getServiceNamespaceString(program: Program): string | undefined {
  const serviceDetails = getServiceDetails(program);
  return (
    (serviceDetails.namespace && program.checker!.getNamespaceString(serviceDetails.namespace)) ||
    undefined
  );
}

const producesTypesKey = Symbol();

export function produces(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    program.reportDiagnostic("The @produces decorator can only be applied to namespaces.", entity);
  }

  const values = getProduces(program, entity);
  program.stateMap(producesTypesKey).set(entity, values.concat(contentTypes));
}

export function getProduces(program: Program, entity: Type): string[] {
  return program.stateMap(producesTypesKey).get(entity) || [];
}

const consumesTypesKey = Symbol();

export function consumes(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    program.reportDiagnostic("The @consumes decorator can only be applied to namespaces.", entity);
  }

  const values = getConsumes(program, entity);
  program.stateMap(consumesTypesKey).set(entity, values.concat(contentTypes));
}

export function getConsumes(program: Program, entity: Type): string[] {
  return program.stateMap(consumesTypesKey).get(entity) || [];
}
