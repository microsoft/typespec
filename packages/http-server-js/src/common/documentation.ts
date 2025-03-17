// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Type, getDoc } from "@typespec/compiler";
import { JsContext } from "../ctx.js";
import { indent } from "../util/iter.js";

/**
 * Emit the documentation for a type in JSDoc format.
 *
 * This assumes that the documentation may include Markdown formatting.
 *
 * @param ctx - The emitter context.
 * @param type - The type to emit documentation for.
 */
export function* emitDocumentation(ctx: JsContext, type: Type): Iterable<string> {
  const doc = getDoc(ctx.program, type);

  if (doc === undefined) return;

  yield `/**`;

  yield* indent(doc.trim().split(/\r?\n/g), " * ");

  yield ` */`;
}
