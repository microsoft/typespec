import {
  DecoratorContext,
  getDoc,
  getService,
  getSummary,
  Model,
  Namespace,
  Operation,
  Program,
  Type,
  typespecTypeToJson,
  TypeSpecValue,
} from "@typespec/compiler";
import { setStatusCode } from "@typespec/http";
import {
  DefaultResponseDecorator,
  ExtensionDecorator,
  ExternalDocsDecorator,
  InfoDecorator,
  OperationIdDecorator,
} from "../generated-defs/TypeSpec.OpenAPI.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { AdditionalInfo, ExtensionKey, ExternalDocs } from "./types.js";

const operationIdsKey = createStateSymbol("operationIds");
/**
 * Set a specific operation ID.
 * @param context Decorator Context
 * @param entity Decorator target
 * @param opId Operation ID.
 */
export const $operationId: OperationIdDecorator = (
  context: DecoratorContext,
  entity: Operation,
  opId: string,
) => {
  context.program.stateMap(operationIdsKey).set(entity, opId);
};

/**
 * Returns operationId set via the `@operationId` decorator or `undefined`
 */
export function getOperationId(program: Program, entity: Operation): string | undefined {
  return program.stateMap(operationIdsKey).get(entity);
}

const openApiExtensionKey = createStateSymbol("openApiExtension");

/** {@inheritdoc ExtensionDecorator} */
export const $extension: ExtensionDecorator = (
  context: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: TypeSpecValue,
) => {
  if (!isOpenAPIExtensionKey(extensionName)) {
    reportDiagnostic(context.program, {
      code: "invalid-extension-key",
      format: { value: extensionName },
      target: entity,
    });
  }

  const [data, diagnostics] = typespecTypeToJson(value, entity);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
  setExtension(context.program, entity, extensionName as ExtensionKey, data);
};

/**
 * Set the OpenAPI info node on for the given service namespace.
 * @param program Program
 * @param entity Service namespace
 * @param data OpenAPI Info object
 */
export function setInfo(
  program: Program,
  entity: Namespace,
  data: AdditionalInfo & Record<ExtensionKey, unknown>,
) {
  program.stateMap(infoKey).set(entity, data);
}

/**
 *  Set OpenAPI extension on the given type. Equivalent of using `@extension` decorator
 * @param program Program
 * @param entity Type to annotate
 * @param extensionName Extension key
 * @param data Extension value
 */
export function setExtension(
  program: Program,
  entity: Type,
  extensionName: ExtensionKey,
  data: unknown,
) {
  const openApiExtensions = program.stateMap(openApiExtensionKey);
  const typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, data);
  openApiExtensions.set(entity, typeExtensions);
}

/**
 * Get extensions set for the given type.
 * @param program Program
 * @param entity Type
 */
export function getExtensions(program: Program, entity: Type): ReadonlyMap<ExtensionKey, any> {
  return program.stateMap(openApiExtensionKey).get(entity) ?? new Map<ExtensionKey, any>();
}

function isOpenAPIExtensionKey(key: string): key is ExtensionKey {
  return key.startsWith("x-");
}

/**
 * The @defaultResponse decorator can be applied to a model. When that model is used
 * as the return type of an operation, this return type will be the default response.
 *
 */
const defaultResponseKey = createStateSymbol("defaultResponse");
/** {@inheritdoc DefaultResponseDecorator} */
export const $defaultResponse: DefaultResponseDecorator = (
  context: DecoratorContext,
  entity: Model,
) => {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  setStatusCode(context.program, entity, ["*"]);
  context.program.stateSet(defaultResponseKey).add(entity);
};

/**
 * Check if the given model has been mark as a default response.
 * @param program TypeSpec Program
 * @param entity Model to check.
 * @returns boolean.
 */
export function isDefaultResponse(program: Program, entity: Type): boolean {
  return program.stateSet(defaultResponseKey).has(entity);
}

const externalDocsKey = createStateSymbol("externalDocs");

/**
 * Allows referencing an external resource for extended documentation.
 * @param url The URL for the target documentation. Value MUST be in the format of a URL.
 * @param description A short description of the target documentation.
 */
export const $externalDocs: ExternalDocsDecorator = (
  context: DecoratorContext,
  target: Type,
  url: string,
  description?: string,
) => {
  const doc: ExternalDocs = { url };
  if (description) {
    doc.description = description;
  }
  context.program.stateMap(externalDocsKey).set(target, doc);
};

/**
 * Return external doc info set via the `@externalDocs` decorator.
 * @param program Program
 * @param entity Type
 */
export function getExternalDocs(program: Program, entity: Type): ExternalDocs | undefined {
  return program.stateMap(externalDocsKey).get(entity);
}

const infoKey = createStateSymbol("info");

/** {@inheritdoc InfoDecorator} */
export const $info: InfoDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  model: TypeSpecValue,
) => {
  const [data, diagnostics] = typespecTypeToJson<AdditionalInfo & Record<ExtensionKey, unknown>>(
    model,
    context.getArgumentTarget(0)!,
  );
  context.program.reportDiagnostics(diagnostics);
  if (data === undefined) {
    return;
  }
  setInfo(context.program, entity, data);
};

/**
 * Get the info entry for the given service namespace.
 * @param program Program
 * @param entity Service namespace
 */
export function getInfo(program: Program, entity: Namespace): AdditionalInfo | undefined {
  return program.stateMap(infoKey).get(entity);
}

/** Resolve the info entry by merging data specified with `@service`, `@summary` and `@info`. */
export function resolveInfo(program: Program, entity: Namespace): AdditionalInfo | undefined {
  const info = getInfo(program, entity);
  const service = getService(program, entity);
  return omitUndefined({
    ...info,
    title: info?.title ?? service?.title,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    version: info?.version ?? service?.version,
    summary: info?.summary ?? getSummary(program, entity),
    description: info?.description ?? getDoc(program, entity),
  });
}

function omitUndefined<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined)) as any;
}
