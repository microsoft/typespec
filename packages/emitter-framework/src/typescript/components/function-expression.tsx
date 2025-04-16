import { splitProps } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface FunctionExpressionProps extends ts.FunctionExpressionProps {
  type?: Operation;
  /**
   * Where the parameters from passed to the `parameters` prop should be placed
   * relative the ones created from the T`ypeSpec operation.
   */
  parametersMode?: "prepend" | "append" | "replace";
}

export function FunctionExpression(props: FunctionExpressionProps) {
  const [efProps, updateProps, forwardProps] = splitProps(
    props,
    ["type"],
    ["returnType", "parameters"],
  );

  if (!efProps.type) {
    return <ts.FunctionExpression {...forwardProps} {...updateProps} />;
  }

  const returnType = props.returnType ?? <TypeExpression type={getReturnType(efProps.type)} />;
  const allParameters = buildParameterDescriptors(efProps.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });

  return (
    <ts.FunctionExpression {...forwardProps} returnType={returnType} parameters={allParameters} />
  );
}
