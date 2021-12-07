import {
  ModelTypeProperty,
  OperationType,
  Program,
  setDecoratorNamespace,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";

const baseRoutesKey = Symbol();
export interface HttpOperationType extends OperationType {
  basePath: string;
  route: OperationRoute;
}

export function getHttpOperation(
  program: Program,
  operation: OperationType
): HttpOperationType | undefined {
  if (!operation.namespace || !isRoute(program, operation.namespace!)) {
    return undefined;
  }
  return {
    basePath: basePathForRoute(program, operation)!,
    route: getOperationRoute(program, operation)!,
    kind: operation.kind,
    name: operation.name,
    node: operation.node,
    returnType: operation.returnType,
    namespace: operation.namespace,
    parameters: operation.parameters,
    decorators: operation.decorators,
    projections: [],
    projectionsByName() {
      return [];
    },
  };
}

export function $route(program: Program, entity: Type, basePath = "") {
  if (entity.kind !== "Namespace" && entity.kind !== "Interface") return;
  program.stateMap(baseRoutesKey).set(entity, basePath);
}

export function getRoutes(program: Program) {
  return Array.from(program.stateMap(baseRoutesKey).keys());
}

export function isRoute(program: Program, obj: Type) {
  return program.stateMap(baseRoutesKey).has(obj);
}

export function basePathForRoute(program: Program, resource: Type) {
  return program.stateMap(baseRoutesKey).get(resource);
}

const headerFieldsKey = Symbol();
export function $header(program: Program, entity: Type, headerName: string) {
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

export function isBody(program: Program, entity: Type) {
  return program.stateSet(bodyFieldsKey).has(entity);
}

export function hasBody(program: Program, parameters: ModelTypeProperty[]): boolean {
  return parameters.find((p) => isBody(program, p)) !== undefined;
}

export type HttpVerb = "get" | "put" | "post" | "patch" | "delete";

interface OperationRoute {
  verb: HttpVerb;
  subPath?: string;
}

const operationRoutesKey = Symbol();

function setOperationRoute(program: Program, entity: Type, verb: OperationRoute): void {
  if (entity.kind === "Operation") {
    if (!program.stateMap(operationRoutesKey).has(entity)) {
      program.stateMap(operationRoutesKey).set(entity, verb);
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
      format: { verb: verb.verb, entityKind: entity.kind },
      target: entity,
    });
  }
}

export function getOperationRoute(program: Program, entity: Type): OperationRoute | undefined {
  return program.stateMap(operationRoutesKey).get(entity);
}

export function $get(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "get",
    subPath,
  });
}

export function $put(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "put",
    subPath,
  });
}

export function $post(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "post",
    subPath,
  });
}

export function $patch(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "patch",
    subPath,
  });
}

export function $delete(program: Program, entity: Type, subPath?: string) {
  setOperationRoute(program, entity, {
    verb: "delete",
    subPath,
  });
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
  $route
);
