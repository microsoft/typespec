import type { TypeSpecHttpClientDecorators } from "../../generated-defs/TypeSpec.HttpClient.js";
import { $dynamicModel } from "./lib/decorators.js";

export { $lib } from "./lib/lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.HttpClient": {
    dynamicModel: $dynamicModel,
  } satisfies TypeSpecHttpClientDecorators,
};
