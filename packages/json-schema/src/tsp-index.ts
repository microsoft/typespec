import type { TypeSpecJsonSchemaDecorators } from "../generated-defs/TypeSpec.JsonSchema.js";
import type { TypeSpecJsonSchemaPrivateDecorators } from "../generated-defs/TypeSpec.JsonSchema.Private.js";
import { $extension, $jsonSchema, $validatesRawJson } from "./decorators.js";

export { $flags, $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.JsonSchema": {
    jsonSchema: $jsonSchema,
    extension: $extension,
  } satisfies TypeSpecJsonSchemaDecorators,
  "TypeSpec.JsonSchema.Private": {
    validatesRawJson: $validatesRawJson,
  } satisfies TypeSpecJsonSchemaPrivateDecorators,
};
