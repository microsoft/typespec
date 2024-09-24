import { refkey as getRefkey} from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Scalar } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.jsx";
import { $ } from "@typespec/compiler/typekit";

export interface TypedAliasDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Scalar;
  name?: string;
}

export type TypeAliasDeclarationProps = TypedAliasDeclarationProps | ts.TypeDeclarationProps;

export function TypeAliasDeclaration(props: TypeAliasDeclarationProps) {
  if (!isTypedAliasDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props}>{props.children}</ts.TypeDeclaration>;
  }

  const name = props.name ?? ts.useTSNamePolicy().getName($.type.getPlausibleName(props.type), "type");
  return <ts.TypeDeclaration {...props} name={name}  refkey={props.refkey ?? getRefkey(props.type)}>
    <TypeExpression type={props.type} />
    {props.children}
  </ts.TypeDeclaration>

}

function isTypedAliasDeclarationProps(
  props: TypeAliasDeclarationProps
): props is TypedAliasDeclarationProps {
  return "type" in props;
}
