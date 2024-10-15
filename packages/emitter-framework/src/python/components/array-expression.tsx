import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface ArrayExpressionModel {
  /** The element type of the Array. */
  elementType: Type;
}

export function ArrayExpression({ elementType }: ArrayExpressionModel) {
  return (
    <>
      List[<TypeExpression type={elementType} />]
    </>
  );
}
