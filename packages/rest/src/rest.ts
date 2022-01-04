import {
  $list,
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

const discriminatorKey = Symbol();
export function $discriminator(program: Program, entity: Type, propertyName: string) {
  if (entity.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "discriminator", entityKind: entity.kind },
      target: entity,
    });
    return;
  }
  program.stateMap(discriminatorKey).set(entity, propertyName);
}

export function getDiscriminator(program: Program, entity: Type): any | undefined {
  const propertyName = program.stateMap(discriminatorKey).get(entity);
  if (propertyName) {
    return { propertyName };
  }
  return undefined;
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
): ResourceOperation | undefined {
  return program.stateMap(resourceOperationsKey).get(cadlOperation);
}

export function $readsResource(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "read");
}

export function $createsResource(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "create");
}

export function $createsOrUpdatesResource(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "createOrUpdate");
}

export function $updatesResource(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "update");
}

export function $deletesResource(program: Program, entity: Type, resourceType: Type) {
  setResourceOperation(program, entity, resourceType, "delete");
}

export function $listsResource(program: Program, entity: Type, resourceType: Type) {
  // Skip this for template parameters passed into the decorator
  if (resourceType.kind !== "TemplateParameter") {
    // Add the @list decorator too so that collection routes are generated correctly
    $list(program, entity, resourceType);
  }

  setResourceOperation(program, entity, resourceType, "list");
}

const actionsKey = Symbol();
export function $action(program: Program, entity: Type, name?: string) {
  if (entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "action", entityKind: entity.kind },
      target: entity,
    });
    return;
  }

  program.stateMap(actionsKey).set(entity, name || entity.name);
}

export function getAction(program: Program, operation: OperationType): string | null | undefined {
  return program.stateMap(actionsKey).get(operation);
}

setDecoratorNamespace(
  "Cadl.Rest",
  $produces,
  $consumes,
  $segment,
  $readsResource,
  $createsResource,
  $createsOrUpdatesResource,
  $updatesResource,
  $deletesResource,
  $listsResource,
  $action
);
