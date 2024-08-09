import { TypeSpecOpenAPIDecorators } from "../generated-defs/TypeSpec.OpenAPI.js";
import { $oneOf, $useRef } from "./decorators.js";

export const $decorators = {
  "TypeSpec.OpenAPI": {
    useRef: $useRef,
    oneOf: $oneOf,
  } satisfies TypeSpecOpenAPIDecorators,
};

export { $lib } from "./lib.js";
