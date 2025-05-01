import * as ts from "@alloy-js/typescript";
import { Enum, Union } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";
import { efRefkey } from "../utils/refkey.js";
import { UnionExpression } from "./union-expression.js";

export interface TypedUnionDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Union | Enum;
  name?: string;
}

export type UnionDeclarationProps = TypedUnionDeclarationProps | ts.TypeDeclarationProps;

export function UnionDeclaration(props: UnionDeclarationProps) {
  const { $ } = useTsp();
  if (!isTypedUnionDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props}>{props.children}</ts.TypeDeclaration>;
  }

  const { type, ...coreProps } = props;
  const refkey = [props.refkey ?? [], efRefkey(props.type)].flat();

  const originalName = coreProps.name ?? type.name;

  if (!originalName || originalName === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: type });
  }

  const name = ts.useTSNamePolicy().getName(originalName!, "type");

  return (
    <ts.TypeDeclaration {...props} name={name} refkey={refkey}>
      <UnionExpression type={type}>{coreProps.children}</UnionExpression>
    </ts.TypeDeclaration>
  );
}

function isTypedUnionDeclarationProps(
  props: UnionDeclarationProps,
): props is TypedUnionDeclarationProps {
  return "type" in props;
}
