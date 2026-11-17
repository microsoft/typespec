import { useTsp } from "#core/context/index.js";
import * as py from "@alloy-js/python";
import type { Type } from "@typespec/compiler";
import { EnumDeclaration } from "../enum-declaration/enum-declaration.js";
import { TypeAliasDeclaration } from "../type-alias-declaration/type-alias-declaration.js";

/** TypeSpec source and shared name/documentation options for Python declaration dispatch. */
export interface TypeDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  /** Declaration name override forwarded to the selected enum or alias component. */
  name?: string;
  /** Enums dispatch to EnumDeclaration; all other kinds dispatch to TypeAliasDeclaration. */
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
    default:
      // All other kinds map to a Python type alias using TypeExpression
      return <TypeAliasDeclaration doc={doc} type={type} {...restProps} />;
  }
}
