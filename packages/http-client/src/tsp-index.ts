import type { TypeSpecHttpClientDecorators } from "../generated-defs/TypeSpec.HttpClient.js";

import { $experimental } from "./decorators/index.js";

/** Decorator implementations keyed by their TypeSpec namespace for compiler registration. */
export const $decorators = {
  "TypeSpec.HttpClient": {
    experimental: $experimental,
  } satisfies TypeSpecHttpClientDecorators,
};
