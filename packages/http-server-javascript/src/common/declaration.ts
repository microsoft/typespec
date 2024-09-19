// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { DeclarationType, JsContext, Module } from "../ctx.js";
import { emitEnum } from "./enum.js";
import { emitInterface } from "./interface.js";
import { emitModel } from "./model.js";
import { emitScalar } from "./scalar.js";
import { emitUnion } from "./union.js";

/**
 * Emit a declaration for a module based on its type.
 *
 * The altName is optional and is only used for unnamed models and unions.
 *
 * @param ctx - The emitter context.
 * @param type - The type to emit.
 * @param module - The module that this declaration is written into.
 * @param altName - An alternative name to use for the declaration if it is not named.
 */
export function* emitDeclaration(
  ctx: JsContext,
  type: DeclarationType,
  module: Module,
  altName?: string,
): Iterable<string> {
  switch (type.kind) {
    case "Model": {
      yield* emitModel(ctx, type, module, altName);
      break;
    }
    case "Enum": {
      yield* emitEnum(ctx, type);
      break;
    }
    case "Union": {
      yield* emitUnion(ctx, type, module, altName);
      break;
    }
    case "Interface": {
      yield* emitInterface(ctx, type, module);
      break;
    }
    case "Scalar": {
      yield emitScalar(ctx, type);
      break;
    }
    default: {
      throw new Error(`UNREACHABLE: Unhandled type kind: ${(type satisfies never as any).kind}`);
    }
  }
}
