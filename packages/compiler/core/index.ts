export * from "../lib/decorators.js";
export * as decorators from "../lib/decorators.js";
export * from "../server/index.js";
export * from "./checker.js";
export * from "./decorator-utils.js";
export * from "./diagnostics.js";
export * from "./emitter-utils.js";
export * from "./formatter.js";
export * from "./helpers/index.js";
export {
  createCadlLibrary,
  createTypeSpecLibrary,
  paramMessage,
  setCadlNamespace,
  setTypeSpecNamespace,
} from "./library.js";
export * from "./manifest.js";
export * from "./module-resolver.js";
export * from "./node-host.js";
export * from "./parser.js";
export * from "./path-utils.js";
export * from "./program.js";
export * from "./scanner.js";
export * from "./semantic-walker.js";
export * from "./type-utils.js";
export * from "./types.js";
export {
  DuplicateTracker,
  Queue,
  TwoLevelMap,
  createRekeyableMap,
  getSourceFileKindFromExt,
} from "./util.js";
import * as formatter from "../formatter/index.js";
export const TypeSpecPrettierPlugin = formatter;

/** @deprecated Use TypeSpecPrettierPlugin */
export const CadlPrettierPlugin = TypeSpecPrettierPlugin;
