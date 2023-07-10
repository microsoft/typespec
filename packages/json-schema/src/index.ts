import {
  DecoratorContext,
  EmitContext,
  Enum,
  Model,
  ModelProperty,
  Namespace,
  Program,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  typespecTypeToJson,
} from "@typespec/compiler";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import { JSONSchemaEmitterOptions, createStateSymbol } from "./lib.js";

export { JsonSchemaEmitter } from "./json-schema-emitter.js";
export { $lib, EmitterOptionsSchema, JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "TypeSpec.JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

const jsonSchemaKey = createStateSymbol("JsonSchema");

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = context.getAssetEmitter(JsonSchemaEmitter);

  if (emitter.getOptions().emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else {
    for (const item of getJsonSchemaTypes(context.program)) {
      emitter.emitType(item);
    }
  }

  await emitter.writeOutput();
}

export function $jsonSchema(
  context: DecoratorContext,
  target: JsonSchemaDeclaration | Namespace,
  baseUriOrId?: string
) {
  context.program.stateSet(jsonSchemaKey).add(target);
  if (baseUriOrId) {
    if (target.kind === "Namespace") {
      context.call($baseUri, target, baseUriOrId);
    } else {
      context.call($id, target, baseUriOrId);
    }
  }
}

const baseUriKey = createStateSymbol("JsonSchema.baseURI");
export function $baseUri(context: DecoratorContext, target: Namespace, baseUri: string) {
  context.program.stateMap(baseUriKey).set(target, baseUri);
}

export function getBaseUri(program: Program, target: Type) {
  return program.stateMap(baseUriKey).get(target);
}

export function findBaseUri(
  program: Program,
  target: JsonSchemaDeclaration | Namespace
): string | undefined {
  let baseUrl: string | undefined;
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    baseUrl = getBaseUri(program, current);
    current = current.namespace;
  } while (!baseUrl && current);

  return baseUrl;
}

export function isJsonSchemaDeclaration(program: Program, target: JsonSchemaDeclaration) {
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    if (getJsonSchema(program, current)) {
      return true;
    }

    current = current.namespace;
  } while (current);

  return false;
}

export function getJsonSchemaTypes(program: Program): (Namespace | Model)[] {
  return [...(program.stateSet(jsonSchemaKey) || [])] as (Namespace | Model)[];
}

export function getJsonSchema(program: Program, target: Type) {
  return program.stateSet(jsonSchemaKey).has(target);
}

const multipleOfKey = createStateSymbol("JsonSchema.multipleOf");
export function $multipleOf(context: DecoratorContext, target: Model, value: number) {
  context.program.stateMap(multipleOfKey).set(target, value);
}

export function getMultipleOf(program: Program, target: Type) {
  return program.stateMap(multipleOfKey).get(target);
}

const idKey = createStateSymbol("JsonSchema.id");
export function $id(
  context: DecoratorContext,
  target: Model | Union | Enum | Scalar,
  value: string
) {
  context.program.stateMap(idKey).set(target, value);
}

export function getId(program: Program, target: Type) {
  return program.stateMap(idKey).get(target);
}

const containsKey = createStateSymbol("JsonSchema.contains");
export function $contains(context: DecoratorContext, target: Model | ModelProperty, value: Type) {
  context.program.stateMap(containsKey).set(target, value);
}

export function getContains(program: Program, target: Type) {
  return program.stateMap(containsKey).get(target);
}

const minContainsKey = createStateSymbol("JsonSchema.minContains");
export function $minContains(
  context: DecoratorContext,
  target: Model | ModelProperty,
  value: number
) {
  context.program.stateMap(minContainsKey).set(target, value);
}

export function getMinContains(program: Program, target: Type) {
  return program.stateMap(minContainsKey).get(target);
}

const maxContainsKey = createStateSymbol("JsonSchema.maxContains");
export function $maxContains(
  context: DecoratorContext,
  target: Model | ModelProperty,
  value: number
) {
  context.program.stateMap(maxContainsKey).set(target, value);
}

export function getMaxContains(program: Program, target: Type) {
  return program.stateMap(maxContainsKey).get(target);
}

const uniqueItemsKey = createStateSymbol("JsonSchema.uniqueItems");
export function $uniqueItems(context: DecoratorContext, target: Model | ModelProperty) {
  context.program.stateMap(uniqueItemsKey).set(target, true);
}

export function getUniqueItems(program: Program, target: Type) {
  return program.stateMap(uniqueItemsKey).get(target);
}

const minPropertiesKey = createStateSymbol("JsonSchema.minProperties");
export function $minProperties(
  context: DecoratorContext,
  target: Model | ModelProperty,
  value: number
) {
  context.program.stateMap(minPropertiesKey).set(target, value);
}

export function getMinProperties(program: Program, target: Type) {
  return program.stateMap(minPropertiesKey).get(target);
}

const maxPropertiesKey = createStateSymbol("JsonSchema.maxProperties");
export function $maxProperties(
  context: DecoratorContext,
  target: Model | ModelProperty,
  value: number
) {
  context.program.stateMap(maxPropertiesKey).set(target, value);
}

export function getMaxProperties(program: Program, target: Type) {
  return program.stateMap(maxPropertiesKey).get(target);
}

const contentEncodingKey = createStateSymbol("JsonSchema.contentEncoding");
export function $contentEncoding(
  context: DecoratorContext,
  target: StringLiteral | ModelProperty,
  value: string
) {
  context.program.stateMap(contentEncodingKey).set(target, value);
}

export function getContentEncoding(program: Program, target: Type): string {
  return program.stateMap(contentEncodingKey).get(target);
}

const contentMediaType = createStateSymbol("JsonSchema.contentMediaType");
export function $contentMediaType(
  context: DecoratorContext,
  target: StringLiteral | ModelProperty,
  value: string
) {
  context.program.stateMap(contentMediaType).set(target, value);
}

export function getContentMediaType(program: Program, target: Type): string {
  return program.stateMap(contentMediaType).get(target);
}

const contentSchemaKey = createStateSymbol("JsonSchema.contentSchema");
export function $contentSchema(
  context: DecoratorContext,
  target: StringLiteral | ModelProperty,
  value: Type
) {
  context.program.stateMap(contentSchemaKey).set(target, value);
}

export function getContentSchema(program: Program, target: Type) {
  return program.stateMap(contentSchemaKey).get(target);
}

const prefixItemsKey = createStateSymbol("JsonSchema.prefixItems");
export function $prefixItems(
  context: DecoratorContext,
  target: Model | ModelProperty,
  value: Tuple
) {
  context.program.stateMap(prefixItemsKey).set(target, value);
}

export function getPrefixItems(program: Program, target: Type): Tuple | undefined {
  return program.stateMap(prefixItemsKey).get(target);
}

export interface ExtensionRecord {
  key: string;
  value: Type;
}

const extensionsKey = createStateSymbol("JsonSchema.extension");
export function $extension(context: DecoratorContext, target: Type, key: string, value: Type) {
  const stateMap = context.program.stateMap(extensionsKey) as Map<Type, ExtensionRecord[]>;
  const extensions = stateMap.has(target)
    ? stateMap.get(target)!
    : stateMap.set(target, []).get(target)!;

  extensions.push({ key, value });
}

export function getExtensions(program: Program, target: Type): ExtensionRecord[] {
  return program.stateMap(extensionsKey).get(target) ?? [];
}

export function $validatesRawJson(context: DecoratorContext, target: Model, value: Type) {
  const [_, diagnostics] = typespecTypeToJson(value, target);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
}
$validatesRawJson.namespace = "Private";
