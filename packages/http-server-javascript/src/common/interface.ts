// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Interface, Operation, Type, UnionVariant, isErrorModel } from "@typespec/compiler";
import { JsContext, Module, PathCursor } from "../ctx.js";
import { parseCase } from "../util/case.js";
import { getAllProperties } from "../util/extends.js";
import { bifilter, indent } from "../util/iter.js";
import { emitDocumentation } from "./documentation.js";
import { emitTypeReference, isValueLiteralType } from "./reference.js";
import { emitUnionType } from "./union.js";

/**
 * Emit an interface declaration.
 *
 * @param ctx - The emitter context.
 * @param iface - The interface to emit.
 * @param module - The module that this interface is written into.
 */
export function* emitInterface(ctx: JsContext, iface: Interface, module: Module): Iterable<string> {
  const name = parseCase(iface.name).pascalCase;

  yield* emitDocumentation(ctx, iface);
  yield `export interface ${name}<Context = unknown> {`;
  yield* indent(emitOperationGroup(ctx, iface.operations.values(), module));
  yield "}";
  yield "";
}

/**
 * Emit a list of operation signatures.
 *
 * @param ctx - The emitter context.
 * @param operations - The operations to emit.
 * @param module - The module that the operations are written into.
 */
export function* emitOperationGroup(
  ctx: JsContext,
  operations: Iterable<Operation>,
  module: Module,
): Iterable<string> {
  for (const op of operations) {
    yield* emitOperation(ctx, op, module);
    yield "";
  }
}

/**
 * Emit a single operation signature.
 *
 * @param ctx - The emitter context.
 * @param op - The operation to emit.
 * @param module - The module that the operation is written into.
 */
export function* emitOperation(ctx: JsContext, op: Operation, module: Module): Iterable<string> {
  const opNameCase = parseCase(op.name);

  const opName = opNameCase.camelCase;

  const hasOptions = getAllProperties(op.parameters).some((p) => p.optional);

  const returnTypeReference = emitTypeReference(ctx, op.returnType, op, module, {
    altName: opNameCase.pascalCase + "Result",
  });

  const returnType = `Promise<${returnTypeReference}>`;

  const params: string[] = [];

  for (const param of getAllProperties(op.parameters)) {
    // If the type is a value literal, then we consider it a _setting_ and not a parameter.
    // This allows us to exclude metadata parameters (such as contentType) from the generated interface.
    if (param.optional || isValueLiteralType(param.type)) continue;

    const paramNameCase = parseCase(param.name);
    const paramName = paramNameCase.camelCase;

    const outputTypeReference = emitTypeReference(ctx, param.type, param, module, {
      altName: opNameCase.pascalCase + paramNameCase.pascalCase,
    });

    params.push(`${paramName}: ${outputTypeReference}`);
  }

  const paramsDeclarationLine = params.join(", ");

  yield* emitDocumentation(ctx, op);

  if (hasOptions) {
    const optionsTypeName = opNameCase.pascalCase + "Options";

    emitOptionsType(ctx, op, module, optionsTypeName);

    const paramsFragment = params.length > 0 ? `${paramsDeclarationLine}, ` : "";

    // prettier-ignore
    yield `${opName}(ctx: Context, ${paramsFragment}options?: ${optionsTypeName}): ${returnType};`;
    yield "";
  } else {
    // prettier-ignore
    yield `${opName}(ctx: Context, ${paramsDeclarationLine}): ${returnType};`;
    yield "";
  }
}

/**
 * Emit a declaration for an options type including the optional parameters of an operation.
 *
 * @param ctx - The emitter context.
 * @param operation - The operation to emit the options type for.
 * @param module - The module that the options type is written into.
 * @param optionsTypeName - The name of the options type.
 */
export function emitOptionsType(
  ctx: JsContext,
  operation: Operation,
  module: Module,
  optionsTypeName: string,
) {
  module.imports.push({
    binder: [optionsTypeName],
    from: ctx.syntheticModule,
  });

  const options = [...operation.parameters.properties.values()].filter((p) => p.optional);

  ctx.syntheticModule.declarations.push([
    `export interface ${optionsTypeName} {`,
    ...options.flatMap((p) => [
      `  ${parseCase(p.name).camelCase}?: ${emitTypeReference(ctx, p.type, p, module, {
        altName: optionsTypeName + parseCase(p.name).pascalCase,
      })};`,
    ]),
    "}",
    "",
  ]);
}

export interface SplitReturnTypeCommon {
  typeReference: string;
  target: Type | [PathCursor, string] | undefined;
}

export interface OrdinarySplitReturnType extends SplitReturnTypeCommon {
  kind: "ordinary";
}

export interface UnionSplitReturnType extends SplitReturnTypeCommon {
  kind: "union";
  variants: UnionVariant[];
}

export type SplitReturnType = OrdinarySplitReturnType | UnionSplitReturnType;

const DEFAULT_NO_VARIANT_RETURN_TYPE = "never";
const DEFAULT_NO_VARIANT_SPLIT: SplitReturnType = {
  kind: "ordinary",
  typeReference: DEFAULT_NO_VARIANT_RETURN_TYPE,
  target: undefined,
};

export function isInfallible(split: SplitReturnType): boolean {
  return (
    (split.kind === "ordinary" && split.typeReference === "never") ||
    (split.kind === "union" && split.variants.length === 0)
  );
}

export function splitReturnType(
  ctx: JsContext,
  type: Type,
  module: Module,
  altBaseName: string,
): [SplitReturnType, SplitReturnType] {
  const successAltName = altBaseName + "Response";
  const errorAltName = altBaseName + "ErrorResponse";

  if (type.kind === "Union") {
    const [successVariants, errorVariants] = bifilter(
      type.variants.values(),
      (v) => !isErrorModel(ctx.program, v.type),
    );

    const successTypeReference =
      successVariants.length === 0
        ? DEFAULT_NO_VARIANT_RETURN_TYPE
        : successVariants.length === 1
          ? emitTypeReference(ctx, successVariants[0].type, successVariants[0], module, {
              altName: successAltName,
            })
          : emitUnionType(ctx, successVariants, module);

    const errorTypeReference =
      errorVariants.length === 0
        ? DEFAULT_NO_VARIANT_RETURN_TYPE
        : errorVariants.length === 1
          ? emitTypeReference(ctx, errorVariants[0].type, errorVariants[0], module, {
              altName: errorAltName,
            })
          : emitUnionType(ctx, errorVariants, module);

    const successSplit: SplitReturnType =
      successVariants.length > 1
        ? {
            kind: "union",
            variants: successVariants,
            typeReference: successTypeReference,
            target: undefined,
          }
        : {
            kind: "ordinary",
            typeReference: successTypeReference,
            target: successVariants[0]?.type,
          };

    const errorSplit: SplitReturnType =
      errorVariants.length > 1
        ? {
            kind: "union",
            variants: errorVariants,
            typeReference: errorTypeReference,
            // target: module.cursor.resolveRelativeItemPath(errorTypeReference),
            target: undefined,
          }
        : {
            kind: "ordinary",
            typeReference: errorTypeReference,
            target: errorVariants[0]?.type,
          };

    return [successSplit, errorSplit];
  } else {
    // No splitting, just figure out if the type is an error type or not and make the other infallible.

    if (isErrorModel(ctx.program, type)) {
      const typeReference = emitTypeReference(ctx, type, type, module, {
        altName: altBaseName + "ErrorResponse",
      });

      return [
        DEFAULT_NO_VARIANT_SPLIT,
        {
          kind: "ordinary",
          typeReference,
          target: type,
        },
      ];
    } else {
      const typeReference = emitTypeReference(ctx, type, type, module, {
        altName: altBaseName + "SuccessResponse",
      });
      return [
        {
          kind: "ordinary",
          typeReference,
          target: type,
        },
        DEFAULT_NO_VARIANT_SPLIT,
      ];
    }
  }
}
