export type {
  ExtensionDecorator,
  JsonSchemaDecorator,
} from "../generated-defs/TypeSpec.JsonSchema.js";
/* eslint-disable @typescript-eslint/no-deprecated */
export type {
  BaseUriDecorator,
  ContainsDecorator,
  ContentEncodingDecorator,
  ContentMediaTypeDecorator,
  ContentSchemaDecorator,
  IdDecorator,
  MaxContainsDecorator,
  MaxPropertiesDecorator,
  MinContainsDecorator,
  MinPropertiesDecorator,
  MultipleOfDecorator,
  OneOfDecorator,
  PrefixItemsDecorator,
  UniqueItemsDecorator,
} from "./back-compat.js";
/* eslint-enable @typescript-eslint/no-deprecated */

/** @internal */
export { JsonSchemaEmitter } from "./json-schema-emitter.js";
export { $flags, $lib, EmitterOptionsSchema } from "./lib.js";
export type { JSONSchemaEmitterOptions } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.JsonSchema";

/* eslint-disable @typescript-eslint/no-deprecated */
export {
  $baseUri,
  $contains,
  $contentEncoding,
  $contentMediaType,
  $contentSchema,
  $id,
  $maxContains,
  $maxProperties,
  $minContains,
  $minProperties,
  $multipleOf,
  $oneOf,
  $prefixItems,
  $uniqueItems,
} from "./back-compat.js";
/* eslint-enable @typescript-eslint/no-deprecated */
export {
  $extension,
  $jsonSchema,
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
