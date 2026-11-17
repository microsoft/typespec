import { code } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression/type-expression.js";

/** Element source for a Python `list[T]` type annotation. */
export interface ArrayExpressionProps {
  /** TypeSpec element type rendered through {@link TypeExpression}. */
  elementType: Type;
}

/** Renders a list type annotation, not a list value; requires the TypeSpec context used by its element expression. */
export function ArrayExpression({ elementType }: ArrayExpressionProps) {
  return code`list[${(<TypeExpression type={elementType} />)}]`;
}
