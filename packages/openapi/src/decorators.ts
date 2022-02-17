import {
  DecoratorContext,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

const operationIdsKey = Symbol();
export function $operationId({ program }: DecoratorContext, entity: Type, opId: string) {
  if (
    !validateDecoratorTarget(program, entity, "@operationId", "Operation") ||
    !validateDecoratorParamType(program, entity, opId, "String")
  ) {
    return;
  }
  program.stateMap(operationIdsKey).set(entity, opId);
}

export function getOperationId(program: Program, entity: Type): string | undefined {
  return program.stateMap(operationIdsKey).get(entity);
}

export type ExtensionKey = `x-${string}`;
const openApiExtensionKey = Symbol();
export function $extension(
  { program }: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: any
) {
  if (!validateDecoratorParamType(program, entity, extensionName, "String")) {
    return;
  }

  if (!isOpenAPIExtensionKey(extensionName)) {
    reportDiagnostic(program, {
      code: "invalid-extension-key",
      format: { value: extensionName },
      target: entity,
    });
  }

  const openApiExtensions = program.stateMap(openApiExtensionKey);
  const typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, value);

  openApiExtensions.set(entity, typeExtensions);
}

export function getExtensions(program: Program, entity: Type): ReadonlyMap<ExtensionKey, any> {
  return program.stateMap(openApiExtensionKey).get(entity) ?? new Map<ExtensionKey, any>();
}

function isOpenAPIExtensionKey(key: string): key is ExtensionKey {
  return key.startsWith("x-");
}

// The @defaultResponse decorator can be applied to a model. When that model is used
// as the return type of an operation, this return type will be the default response.
const defaultResponseKey = Symbol();
export function $defaultResponse({ program }: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(program, entity, "@defaultResponse", "Model")) {
    return;
  }
  program.stateSet(defaultResponseKey).add(entity);
}

export function isDefaultResponse(program: Program, entity: Type): boolean {
  return program.stateSet(defaultResponseKey).has(entity);
}
