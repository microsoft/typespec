export type {
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

/** @internal */
export { JsonSchemaEmitter } from "./json-schema-emitter.js";
export { $flags, $lib, EmitterOptionsSchema } from "./lib.js";
export type { JSONSchemaEmitterOptions } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.JsonSchema";

export {
  $baseUri,
  $contains,
  $contentEncoding,
  $contentMediaType,
  $contentSchema,
  $extension,
  $id,
  $jsonSchema,
  $maxContains,
  $maxProperties,
  $minContains,
  $minProperties,
  $multipleOf,
  $oneOf,
  $prefixItems,
  $uniqueItems,
  findBaseUri,
  getBaseUri,
  getContains,
  getContentEncoding,
  getContentMediaType,
  getContentSchema,
  getExtensions,
  getId,
  getJsonSchema,
  getJsonSchemaTypes,
  getMaxContains,
  getMaxProperties,
  getMinContains,
  getMinProperties,
  getMultipleOf,
  getMultipleOfAsNumeric,
  getPrefixItems,
  getUniqueItems,
  isJsonSchemaDeclaration,
  isOneOf,
  setExtension,
} from "./decorators.js";
export type { ExtensionRecord, JsonSchemaDeclaration } from "./decorators.js";
export { $onEmit } from "./on-emit.js";
/** @internal */
export { $decorators } from "./tsp-index.js";
