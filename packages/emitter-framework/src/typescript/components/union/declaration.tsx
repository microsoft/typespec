import { useDeclarationProvider } from "#core/context/declaration-provider.js";
import { joinRefkeys } from "#typescript/utils/refkey.js";
import { splitProps, type Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, Union } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { UnionExpression } from "./expression.jsx";

export interface TypedUnionDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  type: Union | Enum;
  doc?: Children;
  name?: string;
}

export type UnionDeclarationProps = TypedUnionDeclarationProps | ts.TypeDeclarationProps;

/**
 * Create a union declaration from the given union or enum type.
 */
export function UnionDeclaration(props: UnionDeclarationProps) {
  const { $ } = useTsp();

  if (!isTypedUnionDeclarationProps(props)) {
    return <ts.TypeDeclaration {...props} />;
  }

  const [typeProp, coreProps] = splitProps(props, ["type"]);
  const type = typeProp.type;
  const originalName = coreProps.name ?? type.name ?? "";

  if (originalName === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: type });
  }

  const dp = useDeclarationProvider();
  const refkey = joinRefkeys(props.refkey, dp.getRefkey(type));
  const doc = props.doc ?? $.type.getDoc(type);
  return (
    <ts.TypeDeclaration doc={doc} {...props} name={originalName} refkey={refkey}>
      <UnionExpression type={type}>{coreProps.children}</UnionExpression>
    </ts.TypeDeclaration>
  );
}

function isTypedUnionDeclarationProps(
  props: UnionDeclarationProps,
): props is TypedUnionDeclarationProps {
  return "type" in props;
}
