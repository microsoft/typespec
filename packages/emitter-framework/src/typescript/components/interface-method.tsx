import { splitProps } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface InterfaceMethodProps extends Omit<ts.InterfaceMethodProps, "name"> {
  type?: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
}

export function InterfaceMethod(props: Readonly<InterfaceMethodProps>) {
  const [efProps, updateProps, forwardProps] = splitProps(
    props,
    ["type"],
    ["returnType", "parameters"],
  );

  if (!efProps.type) {
    return <ts.InterfaceMethod {...forwardProps} {...updateProps} name="" />;
  }

  const name = props.name
    ? props.name
    : ts.useTSNamePolicy().getName(efProps.type.name, "function");
  const returnType = props.returnType ?? <TypeExpression type={getReturnType(efProps.type)} />;
  const allParameters = buildParameterDescriptors(efProps.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });

  return (
    <ts.InterfaceMethod
      {...forwardProps}
      name={name}
      returnType={returnType}
      parameters={allParameters}
      {...updateProps}
    />
  );
}
