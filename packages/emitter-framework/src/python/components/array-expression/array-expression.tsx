import { code } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface ArrayExpressionProps {
  elementType: Type;
}

export function ArrayExpression({ elementType }: ArrayExpressionProps) {
  return code`list[${(<TypeExpression type={elementType} />)}]`;
}
