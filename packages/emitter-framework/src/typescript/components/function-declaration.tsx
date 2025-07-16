import * as ts from "@alloy-js/typescript";
import type { Model, Operation } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { declarationRefkeys } from "../utils/refkey.js";
import { TypeExpression } from "./type-expression.js";

export interface FunctionDeclarationPropsWithType
  extends Omit<ts.FunctionDeclarationProps, "name"> {
  type: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
}

export type FunctionDeclarationProps =
  | FunctionDeclarationPropsWithType
  | ts.FunctionDeclarationProps;

/**
 * A TypeScript function declaration. Pass the `type` prop to create the
 * function declaration by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function FunctionDeclaration(props: FunctionDeclarationProps) {
  const { $ } = useTsp();

  if (!isTypedFunctionDeclarationProps(props)) {
    return <ts.FunctionDeclaration {...props} />;
  }

  const refkeys = declarationRefkeys(props.refkey, props.type);

  let name = props.name ? props.name : ts.useTSNamePolicy().getName(props.type.name, "function");

  // TODO: This should probably be a broader check in alloy to guard\
  // any identifier.
  if (reservedFunctionKeywords.has(name)) {
    name = `${name}_`;
  }

  const returnType = props.returnType ?? <TypeExpression type={getReturnType(props.type)} />;
  const allParameters = buildParameterDescriptors(props.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });
  const doc = props.doc ?? $.type.getDoc(props.type);
  return (
    <ts.FunctionDeclaration
      doc={doc}
      refkey={refkeys}
      name={name}
      async={props.async}
      default={props.default}
      export={props.export}
      kind={props.kind}
      returnType={returnType}
      parameters={allParameters}
    >
      {props.children}
    </ts.FunctionDeclaration>
  );
}

export interface TypedFunctionParametersProps extends Omit<ts.FunctionDeclarationProps, "name"> {
  type: Model;
  name?: string;
}

export type FunctionParametersProps = TypedFunctionParametersProps | ts.FunctionParametersProps;

FunctionDeclaration.Parameters = function Parameters(props: FunctionParametersProps) {
  if (!isTypedFunctionParametersProps(props)) {
    return <ts.FunctionDeclaration.Parameters {...props} />;
  }

  const parameterDescriptors = buildParameterDescriptors(props.type);
  return (
    <ts.FunctionDeclaration.Parameters parameters={parameterDescriptors}>
      {props.children}
    </ts.FunctionDeclaration.Parameters>
  );
};

function isTypedFunctionDeclarationProps(
  props: FunctionDeclarationProps,
): props is FunctionDeclarationPropsWithType {
  return "type" in props;
}

function isTypedFunctionParametersProps(
  props: FunctionParametersProps,
): props is TypedFunctionParametersProps {
  return "type" in props;
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
