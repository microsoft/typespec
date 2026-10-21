import * as ts from "@alloy-js/typescript";
import type { Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { declarationRefkeys } from "../utils/refkey.js";
import { EnumDeclaration } from "./enum-declaration.js";
import { InterfaceDeclaration } from "./interface-declaration.jsx";
import { TypeAliasDeclaration } from "./type-alias-declaration.jsx";
import { UnionDeclaration } from "./union/declaration.jsx";

/** Dispatch options for choosing a TypeScript declaration from a TypeSpec type. */
export interface TypeDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  /** Declaration name override; required by Alloy when no TypeSpec type supplies a name. */
  name?: string;
  /** Model, union, enum, scalar, or operation to declare; omit for an ordinary Alloy type declaration. */
  type?: Type;
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Chooses an interface for a model, a union alias for a union, an enum declaration for
 * an enum, or a type alias for a scalar or operation. Other TypeSpec kinds produce
 * no declaration. Requires a TypeSpec context; source documentation supplies the default.
 */
export function TypeDeclaration(props: TypeDeclarationProps) {
  const { $ } = useTsp();
  if (!props.type) {
    const refkeys = declarationRefkeys(props.refkey, props.type);
    return (
      <ts.TypeDeclaration
        {...(props as WithRequired<ts.TypeDeclarationProps, "name">)}
        refkey={refkeys}
      />
    );
  }

  const { type, ...restProps } = props;
  const doc = props.doc ?? $.type.getDoc(type);
  switch (type.kind) {
    case "Model":
      return <InterfaceDeclaration doc={doc} type={type} {...restProps} />;
    case "Union":
      return <UnionDeclaration doc={doc} type={type} {...restProps} />;
    case "Enum":
      return <EnumDeclaration doc={doc} type={type} {...restProps} />;
    case "Scalar":
      return <TypeAliasDeclaration doc={doc} type={type} {...restProps} />;
    case "Operation":
      return <TypeAliasDeclaration doc={doc} type={type} {...restProps} />;
  }
}
