/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $decorators } from "@typespec/events";
import type { TypeSpecEventsDecorators } from "./TypeSpec.Events.js";
/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: TypeSpecEventsDecorators = $decorators["TypeSpec.Events"];
