import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";
import { code } from "@alloy-js/core";

export interface RecordExpressionProps {
  elementType: Type;
}

export function RecordExpression({ elementType }: RecordExpressionProps) {
  return code`
  Record<string, ${<TypeExpression type={elementType} />}>
  `
}
