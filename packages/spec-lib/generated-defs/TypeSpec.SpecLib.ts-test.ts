/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $decorators } from "@typespec/spec-lib";
import type { TypeSpecSpecLibDecorators } from "./TypeSpec.SpecLib.js";
/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: TypeSpecSpecLibDecorators = $decorators["TypeSpec.SpecLib"];
