import { TypeSpecHttpClientDecorators } from "../generated-defs/TypeSpec.HttpClient.js";

import { $experimental } from "./decorators/index.js";

export const $decorators = {
  "TypeSpec.HttpClient": {
    experimental: $experimental,
  } satisfies TypeSpecHttpClientDecorators,
};
