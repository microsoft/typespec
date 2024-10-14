import {
  DecoratorContext,
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
import { createStateSymbol } from "./lib.js";

/**
 * TypeSpec Types that can create a json schmea declaration
 */
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

const jsonSchemaKey = createStateSymbol("JsonSchema");

/** {@inheritdoc JsonSchemaDecorator} */
export const $jsonSchema: JsonSchemaDecorator = (
  context: DecoratorContext,
  target: Type,
  baseUriOrId?: string,
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
/** {@inheritdoc BaseUriDecorator} */
export const $baseUri: BaseUriDecorator = (
  context: DecoratorContext,
  target: Namespace,
  baseUri: string,
) => {
  context.program.stateMap(baseUriKey).set(target, baseUri);
};

/** Get base uri set via `@baseUri` decorator */
export function getBaseUri(program: Program, target: Type) {
  return program.stateMap(baseUriKey).get(target);
}

/** Find base uri for the given type. */
export function findBaseUri(
  program: Program,
  target: JsonSchemaDeclaration | Namespace,
): string | undefined {
  let baseUrl: string | undefined;
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    baseUrl = getBaseUri(program, current);
    current = current.namespace;
  } while (!baseUrl && current);

  return baseUrl;
}

/**
 * Check if the given type is annoted with `@jsonSchema` or within a container annoted with `@jsonSchema`.
 * @param program TypeSpec program
 * @param target Type
 */
export function isJsonSchemaDeclaration(program: Program, target: JsonSchemaDeclaration): boolean {
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    if (getJsonSchema(program, current)) {
      return true;
    }

    current = current.namespace;
  } while (current);

  return false;
}

/**
 * Returns types that are annotated with `@jsonSchema` or contained within a namespace that is annoted with `@jsonSchema`.
 * @param program TypeSpec program
 */
export function getJsonSchemaTypes(program: Program): (Namespace | Model)[] {
  return [...(program.stateSet(jsonSchemaKey) || [])] as (Namespace | Model)[];
}

/** Check if the given type is annotated with `@jsonSchema`  */
export function getJsonSchema(program: Program, target: Type): boolean {
  return program.stateSet(jsonSchemaKey).has(target);
}

const multipleOfKey = createStateSymbol("JsonSchema.multipleOf");
/** {@inheritdoc MultipleOfDecorator} */
export const $multipleOf: MultipleOfDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Numeric,
) => {
  context.program.stateMap(multipleOfKey).set(target, value);
};

/** Get value set by `@multipleOf` decorator as a `Numeric` type. */
export function getMultipleOfAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(multipleOfKey).get(target);
}
/** Get value set by `@multipleOf` decorator as a `number` type. If the value is not representable as a number or not set, returns undefined. */
export function getMultipleOf(program: Program, target: Type): number | undefined {
  return getMultipleOfAsNumeric(program, target)?.asNumber() ?? undefined;
}

const idKey = createStateSymbol("JsonSchema.id");

/** {@inheritdoc IdDecorator} */
export const $id: IdDecorator = (context: DecoratorContext, target: Type, value: string) => {
  context.program.stateMap(idKey).set(target, value);
};

/** Get id as set with `@id` decorator. */
export function getId(program: Program, target: Type) {
  return program.stateMap(idKey).get(target);
}

const oneOfKey = createStateSymbol("JsonSchema.oneOf");
/** {@inheritdoc OneOfDecorator} */
export const $oneOf: OneOfDecorator = (context: DecoratorContext, target: Type) => {
  context.program.stateMap(oneOfKey).set(target, true);
};

/** Check if given type is annotated with `@oneOf` decorator */
export function isOneOf(program: Program, target: Type) {
  return program.stateMap(oneOfKey).has(target);
}

const containsKey = createStateSymbol("JsonSchema.contains");
/** {@inheritdoc ContainsDecorator} */
export const $contains: ContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => {
  context.program.stateMap(containsKey).set(target, value);
};

/** Get contains value set by `@contains` decorator */
export function getContains(program: Program, target: Type) {
  return program.stateMap(containsKey).get(target);
}

const minContainsKey = createStateSymbol("JsonSchema.minContains");
/** {@inheritdoc MinContainsDecorator} */
export const $minContains: MinContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number,
) => {
  context.program.stateMap(minContainsKey).set(target, value);
};

/** Get value set by `@minContains` decorator */
export function getMinContains(program: Program, target: Type) {
  return program.stateMap(minContainsKey).get(target);
}

const maxContainsKey = createStateSymbol("JsonSchema.maxContains");
/** {@inheritdoc MaxContainsDecorator} */
export const $maxContains: MaxContainsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number,
) => {
  context.program.stateMap(maxContainsKey).set(target, value);
};
/** Get value set by `@maxContains` decorator */
export function getMaxContains(program: Program, target: Type) {
  return program.stateMap(maxContainsKey).get(target);
}

const uniqueItemsKey = createStateSymbol("JsonSchema.uniqueItems");
/** {@inheritdoc UniqueItemsDecorator} */
export const $uniqueItems: UniqueItemsDecorator = (context: DecoratorContext, target: Type) => {
  context.program.stateMap(uniqueItemsKey).set(target, true);
};
/** Check if the given array is annotated with `@uniqueItems` decorator */
export function getUniqueItems(program: Program, target: Type): boolean {
  return program.stateMap(uniqueItemsKey).get(target);
}

const minPropertiesKey = createStateSymbol("JsonSchema.minProperties");
/** {@inheritdoc MinPropertiesDecorator} */
export const $minProperties: MinPropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number,
) => {
  context.program.stateMap(minPropertiesKey).set(target, value);
};

/** Get minimum number of properties set by `@minProperties` decorator */
export function getMinProperties(program: Program, target: Type) {
  return program.stateMap(minPropertiesKey).get(target);
}

const maxPropertiesKey = createStateSymbol("JsonSchema.maxProperties");
/** {@inheritdoc MaxPropertiesDecorator} */
export const $maxProperties: MaxPropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
  value: number,
) => {
  context.program.stateMap(maxPropertiesKey).set(target, value);
};
/** Get maximum number of properties set by `@maxProperties` decorator */
export function getMaxProperties(program: Program, target: Type) {
  return program.stateMap(maxPropertiesKey).get(target);
}

const contentEncodingKey = createStateSymbol("JsonSchema.contentEncoding");
/** {@inheritdoc ContentEncodingDecorator} */
export const $contentEncoding: ContentEncodingDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string,
) => {
  context.program.stateMap(contentEncodingKey).set(target, value);
};

/** Get content encoding as configured by `@contentEncoding` decorator. */
export function getContentEncoding(program: Program, target: Type): string {
  return program.stateMap(contentEncodingKey).get(target);
}

const contentMediaType = createStateSymbol("JsonSchema.contentMediaType");
/** {@inheritdoc ContentMediaTypeDecorator} */
export const $contentMediaType: ContentMediaTypeDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string,
) => {
  context.program.stateMap(contentMediaType).set(target, value);
};

/** Get content media type as configured by `@contentMediaType` decorator. */
export function getContentMediaType(program: Program, target: Type): string {
  return program.stateMap(contentMediaType).get(target);
}

const contentSchemaKey = createStateSymbol("JsonSchema.contentSchema");

/** {@inheritdoc ContentSchemaDecorator} */
export const $contentSchema: ContentSchemaDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Type,
) => {
  context.program.stateMap(contentSchemaKey).set(target, value);
};

/** Get content schema set with `@contentSchema` decorator */
export function getContentSchema(program: Program, target: Type) {
  return program.stateMap(contentSchemaKey).get(target);
}

const prefixItemsKey = createStateSymbol("JsonSchema.prefixItems");

/** {@inheritdoc PrefixItemsDecorator} */
export const $prefixItems: PrefixItemsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => {
  context.program.stateMap(prefixItemsKey).set(target, value);
};

/** Get prefix items set with `@prefixItems` decorator */
export function getPrefixItems(program: Program, target: Type): Tuple | undefined {
  return program.stateMap(prefixItemsKey).get(target);
}

/**
 * Data type containing information about an extension.
 */
export interface ExtensionRecord {
  /** Extension key */
  key: string;
  /** Extension value */
  value: Type | unknown;
}

const extensionsKey = createStateSymbol("JsonSchema.extension");
/** {@inheritdoc ExtensionDecorator} */
export const $extension: ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: unknown,
) => {
  setExtension(context.program, target, key, value);
};

/**
 * Get extensions set via the `@extension` decorator on the given type
 * @param program TypeSpec program
 * @param target Type
 */
export function getExtensions(program: Program, target: Type): ExtensionRecord[] {
  return program.stateMap(extensionsKey).get(target) ?? [];
}

/**
 * Set extension on the given type(Same as calling `@extension` decorator)
 * @param program TypeSpec program
 * @param target Type
 * @param key Extension key
 * @param value Extension value
 */
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
  value: any,
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

/** @internal */
export const $validatesRawJson: ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type,
) => {
  const [_, diagnostics] = typespecTypeToJson(value, target);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
};
setTypeSpecNamespace("Private", $validatesRawJson);
