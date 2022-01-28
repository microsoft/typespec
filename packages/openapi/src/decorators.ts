import { Program, Type } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

const operationIdsKey = Symbol();
export function $operationId(program: Program, entity: Type, opId: string) {
  if (entity.kind !== "Operation") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      format: { decorator: "operationId", entityKind: entity.kind },
      target: entity,
    });
    return;
  }
  program.stateMap(operationIdsKey).set(entity, opId);
}

export function getOperationId(program: Program, entity: Type): string | undefined {
  return program.stateMap(operationIdsKey).get(entity);
}

const refTargetsKey = Symbol();
export function $useRef(program: Program, entity: Type, refUrl: string): void {
  if (entity.kind === "Model" || entity.kind === "ModelProperty") {
    program.stateMap(refTargetsKey).set(entity, refUrl);
  } else {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "modelsOperations",
      format: { decoratorName: "useRef" },
      target: entity,
    });
  }
}

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const openApiExtensions = new Map<Type, Map<string, any>>();
export function $extension(program: Program, entity: Type, extensionName: string, value: any) {
  let typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, value);

  openApiExtensions.set(entity, typeExtensions);
}

export function getExtensions(entity: Type): ReadonlyMap<string, any> {
  return openApiExtensions.get(entity) ?? new Map<string, any>();
}
