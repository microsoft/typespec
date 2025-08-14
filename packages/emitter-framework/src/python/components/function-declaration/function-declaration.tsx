import * as py from "@alloy-js/python";
import type { Model, Operation } from "@typespec/compiler";

export interface FunctionDeclarationPropsWithType
  extends Omit<py.FunctionDeclarationProps, "name"> {
  type: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
}

export type FunctionDeclarationProps =
  | FunctionDeclarationPropsWithType
  | py.FunctionDeclarationProps;

/**
 * A TypeScript function declaration. Pass the `type` prop to create the
 * function declaration by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function FunctionDeclaration(props: FunctionDeclarationProps) {
  return (
    <py.FunctionDeclaration
      doc={props.doc}
      name={props.name ?? "get_name"}
      async={props.async}
      returnType={"str"}
      parameters={[{ name: "id", type: "str" }]}
    >
      {props.children}
    </py.FunctionDeclaration>
  );
}

export interface TypedFunctionParametersProps extends Omit<py.FunctionDeclarationProps, "name"> {
  type: Model;
  name?: string;
}

const reservedFunctionKeywords = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "implements",
  "interface",
  "package",
  "private",
  "protected",
  "public",
  "await",
]);
