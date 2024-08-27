import { Union } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";
import { mapJoin } from "@alloy-js/core";

export interface UnionExpressionModel {
  type: Union;
}

export function UnionExpression({ type }: UnionExpressionModel) {
  // TODO: We need to ensure that `Union` is imported from typing
  const values = Array.from(type.variants.values());
  const variantComponents = mapJoin(
    values,
    (variant) => {
      return <TypeExpression type={variant.type} />;
    },
    { joiner: ", " }
  );
  return <>Union[{variantComponents}]</>;
}
