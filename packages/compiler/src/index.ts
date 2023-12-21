import * as coreIndex from "./core/index.js";
console.log("Srcindex", coreIndex);

export { ResolveCompilerOptionsOptions, resolveCompilerOptions } from "./config/index.js";
export * from "./core/index.js";
export * from "./lib/decorators.js";
export * from "./server/index.js";
export const TypeSpecPrettierPlugin = formatter;

import * as formatter from "./formatter/index.js";
/** @deprecated Use TypeSpecPrettierPlugin */
export const CadlPrettierPlugin = TypeSpecPrettierPlugin;
