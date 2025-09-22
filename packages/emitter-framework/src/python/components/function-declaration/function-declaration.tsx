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
