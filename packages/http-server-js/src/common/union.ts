// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Union, UnionVariant } from "@typespec/compiler";
import { JsContext, Module, PartialUnionSynthetic } from "../ctx.js";
import { parseCase } from "../util/case.js";
import { emitDocumentation } from "./documentation.js";
import { emitTypeReference } from "./reference.js";

/**
 * Emit an inline union type. This will automatically import any referenced types that are part of the union.
 *
 * @param ctx - The emitter context.
 * @param variants - The variants of the union.
 * @param module - The module that this union is written into.
 * @returns a string that can be used as a type reference
 */
export function emitUnionType(ctx: JsContext, variants: UnionVariant[], module: Module): string {
  // Treat empty unions as never so that we always return a good type reference here.
  if (variants.length === 0) return "never";

  const variantTypes: string[] = [];

  for (const [_, v] of variants.entries()) {
    const name = emitTypeReference(ctx, v.type, v, module);

    variantTypes.push(name);

    // if (isImportableType(ctx, v.type)) {
    //   module.imports.push({
    //     binder: [name],
    //     from: createOrGetModuleForNamespace(ctx, v.type.namespace!),
    //   });
    // }
  }

  return variantTypes.join(" | ");
}

/**
 * Emits a union type declaration as an alias.
 *
 * This is rare in TypeScript, but may occur in some niche cases where an alias is desirable.
 *
 * @param ctx - The emitter context.
 * @param union - The union to emit.
 * @param module - The module that this union declaration is written into.
 * @param altName - An alternative name to use for the union if it is not named.
 */
export function* emitUnion(
  ctx: JsContext,
  union: Union | PartialUnionSynthetic,
  module: Module,
  altName?: string,
): Iterable<string> {
  const name = union.name ? parseCase(union.name).pascalCase : altName;
  const isPartialSynthetic = union.kind === "partialUnion";

  if (name === undefined) {
    throw new Error("Internal Error: Union name is undefined");
  }

  if (!isPartialSynthetic) yield* emitDocumentation(ctx, union);

  const variants = isPartialSynthetic
    ? union.variants.map((v) => [v.name, v] as const)
    : union.variants.entries();

  const variantTypes = [...variants].map(([_, v]) =>
    emitTypeReference(ctx, v.type, v, module, {
      altName: name + parseCase(String(v.name)).pascalCase,
    }),
  );

  yield `export type ${name} = ${variantTypes.join(" | ")};`;
}
