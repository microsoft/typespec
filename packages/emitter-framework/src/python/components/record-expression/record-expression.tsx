import { code } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression/type-expression.js";

/** Value source for a Python dictionary type with string keys. */
export interface RecordExpressionProps {
  /** TypeSpec value type rendered as the second argument of `dict[str, T]`. */
  elementType: Type;
}

/** Renders a `dict[str, T]` annotation, not a dictionary value, delegating the value type to {@link TypeExpression}. */
export function RecordExpression({ elementType }: RecordExpressionProps) {
  return code`
  dict[str, ${(<TypeExpression type={elementType} />)}]
  `;
}
