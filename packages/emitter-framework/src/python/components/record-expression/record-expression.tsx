import { code } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface RecordExpressionProps {
  elementType: Type;
}

export function RecordExpression({ elementType }: RecordExpressionProps) {
  return code`
  dict[str, ${(<TypeExpression type={elementType} />)}]
  `;
}
