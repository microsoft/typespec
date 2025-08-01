import { TypeSpecHttpClientDecorators } from "../generated-defs/TypeSpec.HttpClient.js";

import { $featureLifecycle } from "./decorators/index.js";

export const $decorators = {
  "TypeSpec.HttpClient": {
    featureLifecycle: $featureLifecycle,
  } satisfies TypeSpecHttpClientDecorators,
};
