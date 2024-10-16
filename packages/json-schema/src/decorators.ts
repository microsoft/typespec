import {
  type DecoratorContext,
  type Enum,
  isType,
  type Model,
  type Namespace,
  type Program,
  type Scalar,
  setTypeSpecNamespace,
  type Tuple,
  type Type,
  typespecTypeToJson,
  type Union,
} from "@typespec/compiler";
import { unsafe_useStateMap, unsafe_useStateSet } from "@typespec/compiler/experimental";
import type { ValidatesRawJsonDecorator } from "../generated-defs/TypeSpec.JsonSchema.Private.js";
import type {
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
import { JsonSchemaStateKeys } from "./lib.js";
import { createDataDecorator } from "./utils.js";

/**
 * TypeSpec Types that can create a json schmea declaration
 */
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

export const [
  /** Check if the given type is annotated with `@jsonSchema`  */
  getJsonSchema,
  markJsonSchema,
] = unsafe_useStateSet(JsonSchemaStateKeys.JsonSchema);
/** {@inheritdoc JsonSchemaDecorator} */
export const $jsonSchema: JsonSchemaDecorator = (
  context: DecoratorContext,
  target: Type,
  baseUriOrId?: string,
) => {
  markJsonSchema(context.program, target);
  if (baseUriOrId) {
    if (target.kind === "Namespace") {
      context.call($baseUri, target, baseUriOrId);
    } else {
      context.call($id, target, baseUriOrId);
    }
  }
};

export const [
  /** Get base uri set via `@baseUri` decorator */
  getBaseUri,
  setBaseUri,
  /** {@inheritdoc BaseUriDecorator} */
  $baseUri,
] = createDataDecorator(JsonSchemaStateKeys["JsonSchema.baseURI"]);

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
  return [...(program.stateSet(JsonSchemaStateKeys.JsonSchema) || [])] as (Namespace | Model)[];
}

export const [
  /** Get value set by `@multipleOf` decorator as a `Numeric` type. */
  getMultipleOfAsNumeric,
  setMultipleOf,
  /** {@inheritdoc MultipleOfDecorator} */

  $multipleOf,
] = createDataDecorator<MultipleOfDecorator, Type>(JsonSchemaStateKeys["JsonSchema.multipleOf"]);

/** Get value set by `@multipleOf` decorator as a `number` type. If the value is not representable as a number or not set, returns undefined. */
export function getMultipleOf(program: Program, target: Type): number | undefined {
  return getMultipleOfAsNumeric(program, target)?.asNumber() ?? undefined;
}

export const [
  /** Get id as set with `@id` decorator. */
  getId,
  setId,
  /** {@inheritdoc IdDecorator} */
  $id,
] = createDataDecorator<IdDecorator>(JsonSchemaStateKeys["JsonSchema.id"]);

export const [
  /** Check if given type is annotated with `@oneOf` decorator */
  isOneOf,
  markOneOf,
] = unsafe_useStateSet(JsonSchemaStateKeys["JsonSchema.oneOf"]);

/** {@inheritdoc OneOfDecorator} */
export const $oneOf: OneOfDecorator = (context: DecoratorContext, target: Type) => {
  markOneOf(context.program, target);
};

export const [
  /** Get contains value set by `@contains` decorator */
  getContains,
  setContains,
  /** {@inheritdoc ContainsDecorator} */
  $contains,
] = createDataDecorator<ContainsDecorator>(JsonSchemaStateKeys["JsonSchema.contains"]);

export const [
  /** Get value set by `@minContains` decorator */
  getMinContains,
  setMinContains,
  /** {@inheritdoc MinContainsDecorator} */
  $minContains,
] = createDataDecorator<MinContainsDecorator>(JsonSchemaStateKeys["JsonSchema.minContains"]);

export const [
  /** Get value set by `@maxContains` decorator */
  getMaxContains,
  setMaxContains,
  /** {@inheritdoc MaxContainsDecorator} */
  $maxContains,
] = createDataDecorator<MaxContainsDecorator>(JsonSchemaStateKeys["JsonSchema.maxContains"]);

export const [
  /** Check if the given array is annotated with `@uniqueItems` decorator */
  getUniqueItems,
  setUniqueItems,
] = unsafe_useStateMap(JsonSchemaStateKeys["JsonSchema.uniqueItems"]);
/** {@inheritdoc UniqueItemsDecorator} */
export const $uniqueItems: UniqueItemsDecorator = (context: DecoratorContext, target: Type) =>
  setUniqueItems(context.program, target, true);

export const [
  /** Get minimum number of properties set by `@minProperties` decorator */
  getMinProperties,
  setMinProperties,
  /** {@inheritdoc MinPropertiesDecorator} */
  $minProperties,
] = createDataDecorator<MinPropertiesDecorator>(JsonSchemaStateKeys["JsonSchema.minProperties"]);

export const [
  /** Get maximum number of properties set by `@maxProperties` decorator */

  getMaxProperties,
  setMaxProperties,
  /** {@inheritdoc MaxPropertiesDecorator} */
  $maxProperties,
] = createDataDecorator<MaxPropertiesDecorator>(JsonSchemaStateKeys["JsonSchema.maxProperties"]);

export const [
  /** Get content encoding as configured by `@contentEncoding` decorator. */
  getContentEncoding,
  setContentEncoding,
  /** {@inheritdoc ContentEncodingDecorator} */
  $contentEncoding,
] = createDataDecorator<ContentEncodingDecorator, Type>(
  JsonSchemaStateKeys["JsonSchema.contentEncoding"],
);

export const [
  /** Get content media type as configured by `@contentMediaType` decorator. */
  getContentMediaType,
  setContentMediaType,
  /** {@inheritdoc ContentMediaTypeDecorator} */
  $contentMediaType,
] = createDataDecorator<ContentMediaTypeDecorator, Type>(
  JsonSchemaStateKeys["JsonSchema.contentMediaType"],
);

export const [
  /** Get content schema set with `@contentSchema` decorator */
  getContentSchema,
  setContentSchema,
  /** {@inheritdoc ContentSchemaDecorator} */
  $contentSchema,
] = createDataDecorator<ContentSchemaDecorator, Type>(
  JsonSchemaStateKeys["JsonSchema.contentSchema"],
);

export const [
  /** Get prefix items set with `@prefixItems` decorator */
  getPrefixItems,
  setPrefixItems,
] = unsafe_useStateMap<Type, Tuple>(JsonSchemaStateKeys["JsonSchema.prefixItems"]);

/** {@inheritdoc PrefixItemsDecorator} */
export const $prefixItems: PrefixItemsDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => {
  setPrefixItems(context.program, target, value as Tuple); // This cast is incorrect and would cause a crash https://github.com/microsoft/typespec/issues/4742
};

/**
 * Data type containing information about an extension.
 */
export interface ExtensionRecord {
  /** Extension key */
  key: string;
  /** Extension value */
  value: Type | unknown;
}

const [getExtensionsInternal, _, getExtensionsStateMap] = unsafe_useStateMap<
  Type,
  ExtensionRecord[]
>(JsonSchemaStateKeys["JsonSchema.extension"]);
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
  return getExtensionsInternal(program, target) ?? [];
}
/**
 * Set extension on the given type(Same as calling `@extension` decorator)
 * @param program TypeSpec program
 * @param target Type
 * @param key Extension key
 * @param value Extension value
 */
export function setExtension(program: Program, target: Type, key: string, value: unknown) {
  const stateMap = getExtensionsStateMap(program);

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
