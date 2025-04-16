import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Enum, EnumMember, Union, UnionVariant } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "./type-expression.jsx";

export interface UnionExpressionProps {
  type: Union | Enum;
  children?: Children;
}

export function UnionExpression({ type, children }: UnionExpressionProps) {
  const { $ } = useTsp();
  const items = ($.union.is(type) ? type.variants : type.members) as Map<
    string,
    UnionVariant | EnumMember
  >;

  const variants = (
    <ay.For joiner={" | "} each={items}>
      {(_, value) => {
        if ($.enumMember.is(value)) {
          return <ts.ValueExpression jsValue={value.value ?? value.name} />;
        } else {
          return <TypeExpression type={value.type} />;
        }
      }}
    </ay.For>
  );

  if (children || (Array.isArray(children) && children.length)) {
    return (
      <>
        {variants} {` | ${children}`}
      </>
    );
  }

  return variants;
}
