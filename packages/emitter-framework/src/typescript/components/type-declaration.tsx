import * as ts from "@alloy-js/typescript";
import type { Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { declarationRefkeys } from "../utils/refkey.js";
import { EnumDeclaration } from "./enum-declaration.js";
import { InterfaceDeclaration } from "./interface-declaration.jsx";
import { TypeAliasDeclaration } from "./type-alias-declaration.jsx";
import { UnionDeclaration } from "./union-declaration.jsx";

export interface TypeDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  name?: string;
  type?: Type;
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

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
