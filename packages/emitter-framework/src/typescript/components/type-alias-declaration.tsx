import { refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";
import { TypeExpression } from "./type-expression.jsx";

export interface TypedAliasDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Type;
  name?: string;
}

export type TypeAliasDeclarationProps = TypedAliasDeclarationProps | ts.TypeDeclarationProps;

/**
 * Create a TypeScript type alias declaration. Pass the `type` prop to emit the
 * type alias as the provided TypeSpec type.
 */
export function TypeAliasDeclaration(props: TypeAliasDeclarationProps) {
  const { $ } = useTsp();
  if (!isTypedAliasDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props}>{props.children}</ts.TypeDeclaration>;
  }

  const originalName =
    props.name ??
    ("name" in props.type && typeof props.type.name === "string" ? props.type.name : "");

  if (!originalName || originalName === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }

  const name = ts.useTSNamePolicy().getName(originalName, "type");
  return (
    <ts.TypeDeclaration {...props} name={name} refkey={props.refkey ?? getRefkey(props.type)}>
      <TypeExpression type={props.type} noReference />
      {props.children}
    </ts.TypeDeclaration>
  );
}

function isTypedAliasDeclarationProps(
  props: TypeAliasDeclarationProps,
): props is TypedAliasDeclarationProps {
  return "type" in props;
}
