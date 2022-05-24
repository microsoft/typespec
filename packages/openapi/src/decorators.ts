import {
  cadlTypeToJson,
  CadlValue,
  DecoratorContext,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { http } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";

export const namespace = "OpenAPI";

export function $notinnamespace(context: DecoratorContext, entity: Type, opId: string) {}

const operationIdsKey = Symbol("operationIds");
export function $operationId(context: DecoratorContext, entity: Type, opId: string) {
  if (
    !validateDecoratorTarget(context, entity, "@operationId", "Operation") ||
    !validateDecoratorParamType(context.program, entity, opId, "String")
  ) {
    return;
  }
  context.program.stateMap(operationIdsKey).set(entity, opId);
}

export function getOperationId(program: Program, entity: Type): string | undefined {
  return program.stateMap(operationIdsKey).get(entity);
}

export type ExtensionKey = `x-${string}`;
const openApiExtensionKey = Symbol("openApiExtension");
export function $extension(
  context: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: CadlValue
) {
  if (!validateDecoratorParamType(context.program, entity, extensionName, "String")) {
    return;
  }

  if (!isOpenAPIExtensionKey(extensionName)) {
    reportDiagnostic(context.program, {
      code: "invalid-extension-key",
      format: { value: extensionName },
      target: entity,
    });
  }

  const [data, diagnostics] = cadlTypeToJson(value, entity);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
  setExtension(context.program, entity, extensionName as ExtensionKey, data);
}

export function setExtension(
  program: Program,
  entity: Type,
  extensionName: ExtensionKey,
  data: unknown
) {
  const openApiExtensions = program.stateMap(openApiExtensionKey);
  const typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, data);

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
const defaultResponseKey = Symbol("defaultResponse");
export function $defaultResponse(context: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(context, entity, "@defaultResponse", "Model")) {
    return;
  }
  http.setStatusCode(context.program, entity, ["*"]);
  context.program.stateSet(defaultResponseKey).add(entity);
}

export function isDefaultResponse(program: Program, entity: Type): boolean {
  return program.stateSet(defaultResponseKey).has(entity);
}

export interface ExternalDocs {
  url: string;
  description?: string;
}
const externalDocsKey = Symbol("externalDocs");

/**
 * Allows referencing an external resource for extended documentation.
 * @param url The URL for the target documentation. Value MUST be in the format of a URL.
 * @param @optional description A short description of the target documentation.
 */
export function $externalDocs(
  context: DecoratorContext,
  target: Type,
  url: string,
  description?: string
) {
  if (!validateDecoratorParamType(context.program, target, url, "String")) {
    return;
  }
  if (description && !validateDecoratorParamType(context.program, target, description, "String")) {
    return;
  }
  const doc: ExternalDocs = { url };
  if (description) {
    doc.description = description;
  }
  context.program.stateMap(externalDocsKey).set(target, doc);
}

export function getExternalDocs(program: Program, entity: Type): ExternalDocs | undefined {
  return program.stateMap(externalDocsKey).get(entity);
}
