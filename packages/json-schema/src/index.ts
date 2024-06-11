import {
  DecoratorContext,
  EmitContext,
  Enum,
  Model,
  ModelProperty,
  Namespace,
  Numeric,
  Program,
  Scalar,
  Tuple,
  Type,
  Union,
  isType,
  setTypeSpecNamespace,
  typespecTypeToJson,
} from "@typespec/compiler";
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { ValidatesRawJsonDecorator } from "../generated-defs/TypeSpec.JsonSchema.Private.js";
import {
  BaseUriDecorator,
  ContainsDecorator,
  ContentEncodingDecorator,
  ContentMediaTypeDecorator,
  ContentSchemaDecorator,
  ExtensionDecorator,
  IdDecorator,
  JsonSchemaDecorator,
  MaxContainsDecorator,
  MaxPropertiesDecorator,
  MinContainsDecorator,
  MinPropertiesDecorator,
  MultipleOfDecorator,
  OneOfDecorator,
  PrefixItemsDecorator,
  UniqueItemsDecorator,
} from "../generated-defs/TypeSpec.JsonSchema.js";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import { JSONSchemaEmitterOptions, createStateSymbol } from "./lib.js";

export { JsonSchemaEmitter } from "./json-schema-emitter.js";
export { $flags, $lib, EmitterOptionsSchema, JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "TypeSpec.JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

const jsonSchemaKey = createStateSymbol("JsonSchema");

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = createAssetEmitter(context.program, JsonSchemaEmitter as any, context);

  if (emitter.getOptions().emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else {
    for (const item of getJsonSchemaTypes(context.program)) {
      emitter.emitType(item);
    }
  }

  await emitter.writeOutput();
}

export const $jsonSchema: JsonSchemaDecorator = (
  context: DecoratorContext,
  target: Type,
  baseUriOrId?: string
) => {
  context.program.stateSet(jsonSchemaKey).add(target);
  if (baseUriOrId) {
    if (target.kind === "Namespace") {
      context.call($baseUri, target, baseUriOrId);
    } else {
      context.call($id, target, baseUriOrId);
    }
  }
};

const baseUriKey = createStateSymbol("JsonSchema.baseURI");
export const $baseUri: BaseUriDecorator = (
  context: DecoratorContext,
  target: Namespace,
  baseUri: string
) => {
  context.program.stateMap(baseUriKey).set(target, baseUri);
};

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
export const $multipleOf: MultipleOfDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Numeric
) => {
  context.program.stateMap(multipleOfKey).set(target, value);
};

export function getMultipleOfAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(multipleOfKey).get(target);
}
export function getMultipleOf(program: Program, target: Type): number | undefined {
  return getMultipleOfAsNumeric(program, target)?.asNumber() ?? undefined;
}

const idKey = createStateSymbol("JsonSchema.id");
export const $id: IdDecorator = (context: DecoratorContext, target: Type, value: string) => {
  context.program.stateMap(idKey).set(target, value);
};

export function getId(program: Program, target: Type) {
  return program.stateMap(idKey).get(target);
}

const oneOfKey = createStateSymbol("JsonSchema.oneOf");
export const $oneOf: OneOfDecorator = (context: DecoratorContext, target: Type) => {
  context.program.stateMap(oneOfKey).set(target, true);
};

export function isOneOf(program: Program, target: Type) {
  return program.stateMap(oneOfKey).has(target);
}

const containsKey = createStateSymbol("JsonSchema.contains");
export const $contains: ContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type
) => {
  context.program.stateMap(containsKey).set(target, value);
};

export function getContains(program: Program, target: Type) {
  return program.stateMap(containsKey).get(target);
}

const minContainsKey = createStateSymbol("JsonSchema.minContains");
export const $minContains: MinContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number
) => {
  context.program.stateMap(minContainsKey).set(target, value);
};

export function getMinContains(program: Program, target: Type) {
  return program.stateMap(minContainsKey).get(target);
}

const maxContainsKey = createStateSymbol("JsonSchema.maxContains");
export const $maxContains: MaxContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number
) => {
  context.program.stateMap(maxContainsKey).set(target, value);
};

export function getMaxContains(program: Program, target: Type) {
  return program.stateMap(maxContainsKey).get(target);
}

const uniqueItemsKey = createStateSymbol("JsonSchema.uniqueItems");
export const $uniqueItems: UniqueItemsDecorator = (context: DecoratorContext, target: Type) => {
  context.program.stateMap(uniqueItemsKey).set(target, true);
};

export function getUniqueItems(program: Program, target: Type) {
  return program.stateMap(uniqueItemsKey).get(target);
}

const minPropertiesKey = createStateSymbol("JsonSchema.minProperties");
export const $minProperties: MinPropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number
) => {
  context.program.stateMap(minPropertiesKey).set(target, value);
};

export function getMinProperties(program: Program, target: Type) {
  return program.stateMap(minPropertiesKey).get(target);
}

const maxPropertiesKey = createStateSymbol("JsonSchema.maxProperties");
export const $maxProperties: MaxPropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number
) => {
  context.program.stateMap(maxPropertiesKey).set(target, value);
};

export function getMaxProperties(program: Program, target: Type) {
  return program.stateMap(maxPropertiesKey).get(target);
}

const contentEncodingKey = createStateSymbol("JsonSchema.contentEncoding");
export const $contentEncoding: ContentEncodingDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string
) => {
  context.program.stateMap(contentEncodingKey).set(target, value);
};

export function getContentEncoding(program: Program, target: Type): string {
  return program.stateMap(contentEncodingKey).get(target);
}

const contentMediaType = createStateSymbol("JsonSchema.contentMediaType");
export const $contentMediaType: ContentMediaTypeDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string
) => {
  context.program.stateMap(contentMediaType).set(target, value);
};

export function getContentMediaType(program: Program, target: Type): string {
  return program.stateMap(contentMediaType).get(target);
}

const contentSchemaKey = createStateSymbol("JsonSchema.contentSchema");
export const $contentSchema: ContentSchemaDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Type
) => {
  context.program.stateMap(contentSchemaKey).set(target, value);
};

export function getContentSchema(program: Program, target: Type) {
  return program.stateMap(contentSchemaKey).get(target);
}

const prefixItemsKey = createStateSymbol("JsonSchema.prefixItems");
export const $prefixItems: PrefixItemsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type
) => {
  context.program.stateMap(prefixItemsKey).set(target, value);
};

export function getPrefixItems(program: Program, target: Type): Tuple | undefined {
  return program.stateMap(prefixItemsKey).get(target);
}

export interface ExtensionRecord {
  key: string;
  value: Type | unknown;
}

const extensionsKey = createStateSymbol("JsonSchema.extension");
export const $extension: ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: unknown
) => {
  setExtension(context.program, target, key, value);
};

export function getExtensions(program: Program, target: Type): ExtensionRecord[] {
  return program.stateMap(extensionsKey).get(target) ?? [];
}

export function setExtension(program: Program, target: Type, key: string, value: unknown) {
  const stateMap = program.stateMap(extensionsKey) as Map<Type, ExtensionRecord[]>;
  const extensions = stateMap.has(target)
    ? stateMap.get(target)!
    : stateMap.set(target, []).get(target)!;

  // Check if we were handed the `Json` template model
  if (isJsonTemplateType(value)) {
    extensions.push({
      key,
      value: typespecTypeToJson(value.properties.get("value")!.type, target)[0],
    });
  } else {
    extensions.push({ key, value });
  }
}

function isJsonTemplateType(
  value: any
): value is Type & { kind: "Model"; name: "Json"; namespace: { name: "JsonSchema" } } {
  return (
    typeof value === "object" &&
    value !== null &&
    isType(value) &&
    value.kind === "Model" &&
    value.name === "Json" &&
    value.namespace?.name === "JsonSchema"
  );
}

export const $validatesRawJson: ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type
) => {
  const [_, diagnostics] = typespecTypeToJson(value, target);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
};
setTypeSpecNamespace("Private", $validatesRawJson);
