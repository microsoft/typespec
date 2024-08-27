
import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface ArrayExpressionModel {
  /** The element type of the Array. */
  type: Type;
}

export function ArrayExpression({ type }: ArrayExpressionModel) {
  return (
    <>
      List[<TypeExpression type={type} />]
    </>
  );
}
