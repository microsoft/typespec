import * as ts from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { EnumDeclaration } from "./enum-declaration.js";
import { InterfaceDeclaration } from "./interface-declaration.jsx";
import { UnionDeclaration } from "./union-declaration.jsx";
import { TypeAliasDeclaration } from "./type-alias-declaration.jsx";

export interface TypeDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  name?: string;
  type?: Type
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export function TypeDeclaration(props: TypeDeclarationProps) {
  if (!props.type) {
    return <ts.TypeDeclaration {...props as WithRequired<ts.TypeDeclarationProps, "name">} />
  }

  const {type, ...restProps} = props;
  switch (type.kind) {
    case "Model":
      return <InterfaceDeclaration type={type} {...restProps} />
    case "Union":
      return <UnionDeclaration type={type} {...restProps} />
    case "Enum":
      return <EnumDeclaration type={type} {...restProps} />
    case "Scalar":
      return <TypeAliasDeclaration type={type} {...restProps} />
  }
}
