import {
  ModelType,
  OperationType,
  Program,
  setDecoratorNamespace,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";

const producesTypesKey = Symbol();

export function $produces(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    reportDiagnostic(program, { code: "produces-namespace-only", target: entity });
  }

  const values = getProduces(program, entity);
  program.stateMap(producesTypesKey).set(entity, values.concat(contentTypes));
}

export function getProduces(program: Program, entity: Type): string[] {
  return program.stateMap(producesTypesKey).get(entity) || [];
}

const consumesTypesKey = Symbol();

export function $consumes(program: Program, entity: Type, ...contentTypes: string[]) {
  if (entity.kind !== "Namespace") {
    reportDiagnostic(program, { code: "consumes-namespace-only", target: entity });
  }

  const values = getConsumes(program, entity);
  program.stateMap(consumesTypesKey).set(entity, values.concat(contentTypes));
}

export function getConsumes(program: Program, entity: Type): string[] {
  return program.stateMap(consumesTypesKey).get(entity) || [];
}

const segmentsKey = Symbol();
export function $segment(program: Program, entity: Type, name: string) {
  if (entity.kind !== "ModelProperty") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "segment", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  program.stateMap(segmentsKey).set(entity, name);
}

export function getSegment(program: Program, entity: Type): string | undefined {
  if (entity.kind !== "ModelProperty") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "segment", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  return program.stateMap(segmentsKey).get(entity);
}

export type ResourceOperations =
  | "read"
  | "createOrUpdate"
  | "create"
  | "update"
  | "delete"
  | "list";

export interface ResourceOperation {
  operation: string;
  resourceType: ModelType;
}

const resourceOperationsKey = Symbol();

export function setResourceOperation(
  program: Program,
  entity: Type,
  resourceType: Type,
  operation: ResourceOperations
) {
  if (resourceType.kind !== "Model" && resourceType.kind !== "TemplateParameter") {
    reportDiagnostic(program, {
      code: "operation-resource-wrong-type",
      format: { operation, kind: resourceType.kind },
      target: entity,
    });
    return;
  }

  // Only register operations when applied to real model types
  if (resourceType.kind === "Model") {
    program.stateMap(resourceOperationsKey).set(entity, {
      operation,
      resourceType,
    });
  }
}

export function getResourceOperation(
  program: Program,
  cadlOperation: OperationType
): ResourceOperation {
  return program.stateMap(resourceOperationsKey).get(cadlOperation);
}

export function $read(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "read");
}

export function $createOrUpdate(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "createOrUpdate");
}

export function $create(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "create");
}

export function $update(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "update");
}

export function $delete(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "delete");
}

export function $list(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "list");
}

const actionsKey = Symbol();
export function $action(program: Program, entity: Type, resourceType: Type, name: string) {
  if (entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "action", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  program.stateMap(actionsKey).set(entity, name);
}

export function getAction(
  program: Program,
  operation: OperationType,
  defaultActionName?: string
): string | undefined {
  return program.stateMap(actionsKey).get(operation) || defaultActionName;
}

setDecoratorNamespace(
  "Cadl.Rest",
  $produces,
  $consumes,
  $segment,
  $read,
  $create,
  $update,
  $delete,
  $list,
  $action
);
