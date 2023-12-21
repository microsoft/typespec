export { ResolveCompilerOptionsOptions, resolveCompilerOptions } from "./config/index.js";
export * from "./core/index.js";
export * from "./lib/decorators.js";
export * from "./server/index.js";
import * as formatter from "./formatter/index.js";
export const TypeSpecPrettierPlugin = formatter;

/** @deprecated Use TypeSpecPrettierPlugin */
export const CadlPrettierPlugin = TypeSpecPrettierPlugin;
