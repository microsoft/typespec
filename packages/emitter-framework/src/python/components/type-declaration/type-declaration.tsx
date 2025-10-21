import { useTsp } from "#core/context/index.js";
import * as py from "@alloy-js/python";
import type { Type } from "@typespec/compiler";
import { EnumDeclaration } from "../enum-declaration/enum-declaration.jsx";
import { TypeAliasDeclaration } from "../type-alias-declaration/type-alias-declaration.jsx";

export interface TypeDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  name?: string;
  type: Type;
}

/**
 * Single entry point to declare a Python symbol for any TypeSpec `Type`.
 */
export function TypeDeclaration(props: TypeDeclarationProps) {
  const { $ } = useTsp();
  const { type, ...restProps } = props;
  const doc = props.doc ?? $.type.getDoc(type);
  switch (type.kind) {
    case "Enum":
      return <EnumDeclaration doc={doc} type={type} {...restProps} />;
    // TODO: Handle models, interfaces and operations
    default:
      // All other kinds map to a Python type alias using TypeExpression
      return <TypeAliasDeclaration doc={doc} type={type} {...restProps} />;
  }
}
