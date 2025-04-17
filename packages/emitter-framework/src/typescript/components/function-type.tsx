import { splitProps } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface FunctionTypeProps extends ts.FunctionTypeProps {
  type?: Operation;
  parametersMode?: "prepend" | "append" | "replace";
}
/**
 * A TypeScript function type. Pass the `type` prop to create the function type
 * by converting from a TypeSpec Operation. Any other props provided will take
 * precedence.
 */
export function FunctionType(props: FunctionTypeProps) {
  const [efProps, updateProps, forwardProps] = splitProps(
    props,
    ["type"],
    ["returnType", "parameters"],
  );

  if (!efProps.type) {
    return <ts.FunctionType {...forwardProps} {...updateProps} />;
  }

  const returnType = props.returnType ?? <TypeExpression type={getReturnType(efProps.type)} />;
  const allParameters = buildParameterDescriptors(efProps.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });

  return <ts.FunctionType {...forwardProps} returnType={returnType} parameters={allParameters} />;
}
