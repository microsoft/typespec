/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $decorators } from "../src/index.js";
import type { TypeSpecDecorators } from "./TypeSpec.js";
/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: TypeSpecDecorators = $decorators["TypeSpec"];
