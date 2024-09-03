import { TypeSpecJsonSchemaDecorators } from "../generated-defs/TypeSpec.JsonSchema.js";
import { TypeSpecJsonSchemaPrivateDecorators } from "../generated-defs/TypeSpec.JsonSchema.Private.js";
import {
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
  $validatesRawJson,
} from "./decorators.js";

export { $flags, $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.JsonSchema": {
    jsonSchema: $jsonSchema,
    baseUri: $baseUri,
    id: $id,
    oneOf: $oneOf,
    multipleOf: $multipleOf,
    contains: $contains,
    minContains: $minContains,
    maxContains: $maxContains,
    uniqueItems: $uniqueItems,
    minProperties: $minProperties,
    maxProperties: $maxProperties,
    contentEncoding: $contentEncoding,
    prefixItems: $prefixItems,
    contentMediaType: $contentMediaType,
    contentSchema: $contentSchema,
    extension: $extension,
  } satisfies TypeSpecJsonSchemaDecorators,
  "TypeSpec.JsonSchema.Private": {
    validatesRawJson: $validatesRawJson,
  } satisfies TypeSpecJsonSchemaPrivateDecorators,
};
