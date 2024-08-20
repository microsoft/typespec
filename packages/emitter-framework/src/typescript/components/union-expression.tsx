import { Children, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Enum, Union } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface UnionExpressionProps {
  type: Union | Enum;
  children?: Children;
}

export function UnionExpression({ type, children }: UnionExpressionProps) {
  let variants: any[];

  if (type.kind === "Enum") {
    variants = mapJoin(
      type.members,
      (_, value) => {
        return <ts.ValueExpression jsValue={value.value ?? value.name} />;
      },
      { joiner: " | " }
    );
  } else {
    variants = mapJoin(
      type.variants,
      (_, variant) => {
        return <TypeExpression type={variant.type} />;
      },
      { joiner: " | " }
    );
  }

  return (
    <>
      {variants}
      {variants.length > 1 && children ? " | " : ""}
      {children}
    </>
  );
}
