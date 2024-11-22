export { resolveCompilerOptions, ResolveCompilerOptionsOptions } from "./config/index.js";
export * from "./core/index.js";
export * from "./lib/decorators.js";
export * from "./server/index.js";
export type { PackageJson } from "./types/package-json.js";
import * as formatter from "./formatter/index.js";
export const TypeSpecPrettierPlugin = formatter;

// DO NOT ADD ANYMORE EXPORTS HERE, this is for backcompat. Utils should be exported from the utils folder.
export {
  /** @deprecated use import from  @typespec/compiler/utils */
  createRekeyableMap,
  /** @deprecated use import from  @typespec/compiler/utils */
  DuplicateTracker,
  /** @deprecated use import from  @typespec/compiler/utils */
  Queue,
  /** @deprecated use import from  @typespec/compiler/utils */
  TwoLevelMap,
} from "./utils/index.js";

/** @deprecated Use TypeSpecPrettierPlugin */
export const CadlPrettierPlugin = TypeSpecPrettierPlugin;

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

/** @deprecated use `PackageJson` */
export { PackageJson as NodePackage } from "./types/package-json.js";
