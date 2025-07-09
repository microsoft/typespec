import { type Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, Union } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";
import { declarationRefkeys } from "../utils/refkey.js";
import { UnionExpression } from "./union-expression.js";

export interface TypedUnionDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Union | Enum;
  doc?: Children;
  name?: string;
}

export type UnionDeclarationProps = TypedUnionDeclarationProps | ts.TypeDeclarationProps;

export function UnionDeclaration(props: UnionDeclarationProps) {
  const { $ } = useTsp();
  if (!isTypedUnionDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props}>{props.children}</ts.TypeDeclaration>;
  }

  const { type, ...coreProps } = props;
  const refkeys = declarationRefkeys(props.refkey, props.type);

  const originalName = coreProps.name ?? type.name;

  if (!originalName || originalName === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: type });
  }

  const name = ts.useTSNamePolicy().getName(originalName!, "type");

  const doc = props.doc ?? $.type.getDoc(type);
  return (
    <ts.TypeDeclaration doc={doc} {...props} name={name} refkey={refkeys}>
      <UnionExpression type={type}>{coreProps.children}</UnionExpression>
    </ts.TypeDeclaration>
  );
}

function isTypedUnionDeclarationProps(
  props: UnionDeclarationProps,
): props is TypedUnionDeclarationProps {
  return "type" in props;
}
