import * as ay from "@alloy-js/core";
import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface ArrayExpressionProps {
  elementType: Type;
}

export function ArrayExpression({ elementType }: ArrayExpressionProps) {
  return ay.code`Array<${(<TypeExpression type={elementType} />)}>`;
}
