import { TypeSpecOpenAPIDecorators } from "../generated-defs/TypeSpec.OpenAPI.js";
import { $oneOf, $useRef } from "./decorators.js";

export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.OpenAPI": {
    useRef: $useRef,
    oneOf: $oneOf,
  } satisfies TypeSpecOpenAPIDecorators,
};
