import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface ArrayExpressionProps {
  elementType: Type;
}

export function ArrayExpression({ elementType }: ArrayExpressionProps) {

  return (
    <>
      (<TypeExpression type={elementType} />)[]
    </>
  );
}
