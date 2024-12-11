import { refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Enum, Union } from "@typespec/compiler";
import { UnionExpression } from "./union-expression.js";
import { $ } from "@typespec/compiler/typekit";

export interface TypedUnionDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Union | Enum;
  name?: string;
}

export type UnionDeclarationProps = TypedUnionDeclarationProps | ts.TypeDeclarationProps;

export function UnionDeclaration(props: UnionDeclarationProps) {
  if (!isTypedUnionDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props}>{props.children}</ts.TypeDeclaration>;
  }

  const { type, ...coreProps } = props;
  const refkey = coreProps.refkey ?? getRefkey(type);
  const name = coreProps.name
    ? coreProps.name
    : ts.useTSNamePolicy().getName($.type.getPlausibleName(props.type) ?? "", "type");

 

  return (
    <ts.TypeDeclaration {...props} name={name} refkey={refkey}>
      <UnionExpression type={type} children={undefined}>{coreProps.children}</UnionExpression>
    </ts.TypeDeclaration>
  );
}

function isTypedUnionDeclarationProps(
  props: UnionDeclarationProps
): props is TypedUnionDeclarationProps {
  return "type" in props;
}
