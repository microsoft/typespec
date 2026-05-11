// An error in the imports would mean that the decorator is not exported or
// doesn't have the right name.

import { $decorators, $functions } from "../src/index.js";
import type { TypeSpecDecorators, TypeSpecFunctions } from "./TypeSpec.js";

/**
 * An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ...
 */
const _decs: TypeSpecDecorators = $decorators["TypeSpec"];

/**
 * An error here would mean that the exported function is not using the same signature. Make sure to have export const $funcName: FuncNameFunction = (...) => ...
 */
const _funcs: TypeSpecFunctions = $functions["TypeSpec"];
