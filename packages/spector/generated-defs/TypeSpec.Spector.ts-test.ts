/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $decorators } from "@typespec/spector";
import type { TypeSpecSpectorDecorators } from "./TypeSpec.Spector.js";
/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: TypeSpecSpectorDecorators = $decorators["TypeSpec.Spector"];
