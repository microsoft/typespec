export { ResolveCompilerOptionsOptions, resolveCompilerOptions } from "./config/index.js";
export * from "./core/index.js";
export * from "./lib/decorators.js";
export * from "./server/index.js";
import * as formatter from "./formatter/index.js";
export const TypeSpecPrettierPlugin = formatter;

// DO NOT ADD ANYMORE EXPORTS HERE, this is for backcompat. Utils should be exported from the utils folder.
export {
  /** @deprecated use import from  @typespec/compiler/utils */
  DuplicateTracker,
  /** @deprecated use import from  @typespec/compiler/utils */
  Queue,
  /** @deprecated use import from  @typespec/compiler/utils */
  TwoLevelMap,
  /** @deprecated use import from  @typespec/compiler/utils */
  createRekeyableMap,
} from "./utils/index.js";

/** @deprecated Use TypeSpecPrettierPlugin */
export const CadlPrettierPlugin = TypeSpecPrettierPlugin;

/** @internal for Typespec compiler */
export { $decorators } from "./lib/tsp-index.js";
export { PackageJson } from "./types/package-json.js";
/** @deprecated use `PackageJson` */
export { PackageJson as NodePackage } from "./types/package-json.js";
