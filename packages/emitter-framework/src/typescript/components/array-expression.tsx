import { code } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

/** Element type for an inline TypeScript `Array<T>` type expression. */
export interface ArrayExpressionProps {
  /** TypeSpec type rendered as the generic element argument. */
  elementType: Type;
}

/** Renders an `Array<T>` type, not an array value; delegates element references to {@link TypeExpression}. */
export function ArrayExpression({ elementType }: ArrayExpressionProps) {
  return code`Array<${(<TypeExpression type={elementType} />)}>`;
}
