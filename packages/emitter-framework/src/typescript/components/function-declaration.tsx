import { refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.js";

export interface FunctionDeclarationPropsWithType
  extends Omit<ts.FunctionDeclarationProps, "name"> {
  type: Operation;
  name?: string;
}

export type FunctionDeclarationProps =
  | FunctionDeclarationPropsWithType
  | ts.FunctionDeclarationProps;

export function FunctionDeclaration(props: FunctionDeclarationProps) {
  if (!isTypedFunctionDeclarationProps(props)) {
    if (!props.name) {
    }
    return <ts.FunctionDeclaration {...props} />;
  }

  const refkey = props.refkey ?? getRefkey(props.type);

  let name = props.name ? props.name : ts.useTSNamePolicy().getName(props.type.name, "function");

  // TODO: This should probably be a broader check in alloy to guard\
  // any identifier.
  if (reservedFunctionKeywords.has(name)) {
    name = `${name}_`;
  }

  const returnType = props.returnType ?? <TypeExpression type={getReturnType(props.type)} />;
  const allParameters = buildParameterDescriptors(props.type.parameters, {
    params: props.parameters,
  });
  return (
    <ts.FunctionDeclaration
      refkey={refkey}
      name={name}
      async={props.async}
      default={props.default}
      export={props.export}
      kind={props.kind}
      returnType={returnType}
    >
      <ts.FunctionDeclaration.Parameters parameters={allParameters} />
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
