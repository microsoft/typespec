import * as ts from "@alloy-js/typescript";
import { Model, Operation } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";
import {refkey as getRefkey} from "@alloy-js/core"

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

  const { type, ...coreProps } = props;
  const refkey = coreProps.refkey ?? getRefkey(type);

  const functionName = props.name
    ? props.name
    : ts.useTSNamePolicy().getName(type.name, "function");

  const returnType = props.returnType ? (
    props.returnType
  ) : (
    <TypeExpression type={type.returnType} />
  );

  coreProps.refkey ??= getRefkey(type);
  
  const _props: ts.FunctionDeclarationProps = {
    ...coreProps,
    name: functionName,
    parameters: props.parameters ?? getParameters(type.parameters),
    returnType,
  };

  return <ts.FunctionDeclaration {..._props} refkey={refkey} />;
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

  const { type, ...coreProps } = props;

  const parameters = getParameters(type);
  return <ts.FunctionDeclaration.Parameters {...coreProps} parameters={parameters} />;
};

function getParameters(type: Model): Record<string, string> {
  const namePolicy = ts.useTSNamePolicy();

  const params: Record<string, string> = {};

  for (const [key, prop] of type.properties) {
    let propertyName = namePolicy.getName(key, "parameter");
    if (prop.optional) {
      propertyName += "?";
    }
    params[propertyName] = <TypeExpression type={prop.type} />;
  }

  return params;
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
