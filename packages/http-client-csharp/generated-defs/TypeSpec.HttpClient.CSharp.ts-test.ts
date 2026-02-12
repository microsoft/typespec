// An error in the imports would mean that the decorator is not exported or
// doesn't have the right name.

import { $decorators } from "@typespec/http-client-csharp";
import type { TypeSpecHttpClientCSharpDecorators } from "./TypeSpec.HttpClient.CSharp.js";

/**
 * An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ...
 */
const _: TypeSpecHttpClientCSharpDecorators = $decorators["TypeSpec.HttpClient.CSharp"];
