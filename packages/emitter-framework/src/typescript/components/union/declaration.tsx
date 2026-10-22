import { declarationRefkeys } from "#typescript/utils/refkey.js";
import { type Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, Union } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { UnionExpression } from "./expression.jsx";

/** TypeSpec-backed union alias options, with children contributing additional union alternatives. */
export interface TypedUnionDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  /** Union variants or enum member values used as the alias alternatives. */
  type: Union | Enum;
  doc?: Children;
  /** Name override, passed through the TypeScript type naming policy. */
  name?: string;
}

/** Props for a TypeSpec union/enum alias or an ordinary Alloy type declaration. */
export type UnionDeclarationProps = TypedUnionDeclarationProps | ts.TypeDeclarationProps;

/** Declares a union type alias with source documentation and reference identity, or delegates to Alloy without `type`. */
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
