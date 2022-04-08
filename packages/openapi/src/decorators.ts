import {
  cadlTypeToJson,
  CadlValue,
  DecoratorContext,
  Program,
  setDecoratorNamespace,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { http } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";

setDecoratorNamespace("OpenAPI", $operationId, $extension, $defaultResponse, $externalDocs);

const operationIdsKey = Symbol("operationIds");
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
const openApiExtensionKey = Symbol("openApiExtension");
export function $extension(
  { program }: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: CadlValue
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

  const [data, diagnostics] = cadlTypeToJson(value, entity);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
  setExtension(program, entity, extensionName as ExtensionKey, data);
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
export function $defaultResponse({ program }: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(program, entity, "@defaultResponse", "Model")) {
    return;
  }
  http.setStatusCode(program, entity, ["*"]);
  program.stateSet(defaultResponseKey).add(entity);
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
  { program }: DecoratorContext,
  target: Type,
  url: string,
  description?: string
) {
  if (!validateDecoratorParamType(program, target, url, "String")) {
    return;
  }
  if (description && !validateDecoratorParamType(program, target, description, "String")) {
    return;
  }
  const doc: ExternalDocs = { url };
  if (description) {
    doc.description = description;
  }
  program.stateMap(externalDocsKey).set(target, doc);
}

export function getExternalDocs(program: Program, entity: Type): ExternalDocs | undefined {
  return program.stateMap(externalDocsKey).get(entity);
}
