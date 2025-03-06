export { resolveCompilerOptions, ResolveCompilerOptionsOptions } from "./config/index.js";
export * from "./core/index.js";
export * from "./lib/decorators.js";
export * from "./server/index.js";
export type { PackageJson } from "./types/package-json.js";
import * as formatter from "./formatter/index.js";
export const TypeSpecPrettierPlugin = formatter;

import { $decorators as intrinsicDecorators } from "./lib/intrinsic/tsp-index.js";
import { $decorators as stdDecorators } from "./lib/tsp-index.js";
/** @internal for Typespec compiler */
export const $decorators = {
  TypeSpec: {
    ...stdDecorators.TypeSpec,
  },
  "TypeSpec.Prototypes": {
    ...intrinsicDecorators["TypeSpec.Prototypes"],
  },
};
