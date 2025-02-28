// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Enum } from "@typespec/compiler";
import { JsContext } from "../ctx.js";
import { parseCase } from "../util/case.js";
import { emitDocumentation } from "./documentation.js";

/**
 * Emit an enum declaration.
 *
 * @param ctx - The emitter context.
 * @param enum_ - The enum to emit.
 */
export function* emitEnum(ctx: JsContext, enum_: Enum): Iterable<string> {
  yield* emitDocumentation(ctx, enum_);

  const name = parseCase(enum_.name);

  yield `export enum ${name.pascalCase} {`;

  for (const member of enum_.members.values()) {
    const nameCase = parseCase(member.name);
    yield `  ${nameCase.pascalCase} = ${JSON.stringify(member.value)},`;
  }

  yield `}`;
}
