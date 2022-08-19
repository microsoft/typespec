import {
  cadlTypeToJson,
  CadlValue,
  createDecoratorDefinition,
  DecoratorContext,
  Model,
  Operation,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { http } from "@cadl-lang/rest";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { ExtensionKey } from "./types.js";

export const namespace = "OpenAPI";

const operationIdsKey = createStateSymbol("operationIds");
const operationIdDecorator = createDecoratorDefinition({
  name: "@operationId",
  target: "Operation",
  args: [{ kind: "String" }],
} as const);
/**
 * Set a sepecific operation ID.
 * @param context Decorator Context
 * @param entity Decorator target
 * @param opId Operation ID.
 */
export function $operationId(context: DecoratorContext, entity: Operation, opId: string) {
  if (!operationIdDecorator.validate(context, entity, [opId])) {
    return;
  }
  context.program.stateMap(operationIdsKey).set(entity, opId);
}

/**
 * @returns operationId set via the @operationId decorator or `undefined`
 */
export function getOperationId(program: Program, entity: Operation): string | undefined {
  return program.stateMap(operationIdsKey).get(entity);
}

const openApiExtensionKey = createStateSymbol("openApiExtension");
const extensionDecorator = createDecoratorDefinition({
  name: "@extension",
  target: "Any",
  args: [{ kind: "String" }, { kind: "Any" }],
} as const);
export function $extension(
  context: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: CadlValue
) {
  if (!extensionDecorator.validate(context, entity, [extensionName, value])) {
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

const defaultResponseDecorator = createDecoratorDefinition({
  name: "@defaultResponse",
  target: "Model",
  args: [],
} as const);
/**
 * The @defaultResponse decorator can be applied to a model. When that model is used
 * as the return type of an operation, this return type will be the default response.
 *
 */
const defaultResponseKey = createStateSymbol("defaultResponse");
export function $defaultResponse(context: DecoratorContext, entity: Model) {
  if (!defaultResponseDecorator.validate(context, entity, [])) {
    return;
  }
  http.setStatusCode(context.program, entity, ["*"]);
  context.program.stateSet(defaultResponseKey).add(entity);
}

/**
 * Check if the given model has been mark as a default response.
 * @param program Cadl Program
 * @param entity Model to check.
 * @returns boolean.
 */
export function isDefaultResponse(program: Program, entity: Type): boolean {
  return program.stateSet(defaultResponseKey).has(entity);
}

export interface ExternalDocs {
  url: string;
  description?: string;
}
const externalDocsKey = createStateSymbol("externalDocs");

const externalDocsDecorator = createDecoratorDefinition({
  name: "@externalDocs",
  target: "Any",
  args: [{ kind: "String" }, { kind: "String", optional: true }],
} as const);
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
  if (!externalDocsDecorator.validate(context, target, [url, description])) {
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
