import { Children, refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
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

  const returnType = props.returnType ?? getReturnType(props.type);

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
      {buildParameterDescriptors(props.type.parameters, { params: props.parameters })}
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

interface BuildParameterDescriptorsOptions {
  params?: Record<string, Children | ts.ParameterDescriptor>;
  location?: "start" | "end";
}
function buildParameterDescriptors(type: Model, options: BuildParameterDescriptorsOptions = {}) {
  const namePolicy = ts.useTSNamePolicy();

  const operationParams: Record<string, Children | ts.ParameterDescriptor> = {};

  for (const [key, prop] of type.properties) {
    const paramName = namePolicy.getName(key, "parameter");
    const paramDescriptor: ts.ParameterDescriptor = {
      refkey: getRefkey(prop),
      optional: prop.optional,
      type: <TypeExpression type={prop.type} />,
    };
    operationParams[paramName] = paramDescriptor;
  }

  // Merge parameters based on location
  const allParams =
    options.location === "end"
      ? { ...operationParams, ...options.params }
      : { ...options.params, ...operationParams };

  return <ts.FunctionDeclaration.Parameters parameters={allParams} />;
}

function isTypedFunctionDeclarationProps(
  props: FunctionDeclarationProps
): props is FunctionDeclarationPropsWithType {
  return "type" in props;
}

function isTypedFunctionParametersProps(
  props: FunctionParametersProps
): props is TypedFunctionParametersProps {
  return "type" in props;
}

function getReturnType(
  type: Operation,
  options: { skipErrorFiltering: boolean } = { skipErrorFiltering: false }
) {
  let returnType = type.returnType;

  if (!options.skipErrorFiltering && type.returnType.kind === "Union") {
    returnType = $.union.filter(type.returnType, (variant) => !$.type.isError(variant.type));
  }

  return <TypeExpression type={returnType} />;
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
