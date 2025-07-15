import { splitProps } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface FunctionExpressionProps extends ts.FunctionExpressionProps {
  type?: Operation;
  /**
   * Where the parameters from passed to the `parameters` prop should be placed
   * relative the ones created from the TypeSpec operation.
   */
  parametersMode?: "prepend" | "append" | "replace";
}

/**
 * A TypeScript function expression. Pass the `type` prop to create the
 * function expression by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function FunctionExpression(props: Readonly<FunctionExpressionProps>) {
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
