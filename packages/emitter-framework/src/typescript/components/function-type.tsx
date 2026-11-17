import { splitProps } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

/** Alloy function-type options with optional operation-derived signature defaults. */
export interface FunctionTypeProps extends ts.FunctionTypeProps {
  /** Operation supplying parameters and return type; omit to use only the Alloy props. */
  type?: Operation;
  /**
   * Places explicit parameters before the operation parameters by default.
   * `append` places them after; `replace` discards the operation parameters.
   */
  parametersMode?: "prepend" | "append" | "replace";
}
/**
 * A TypeScript function type. Pass the `type` prop to create the function type
 * by converting from a TypeSpec Operation. Any other props provided will take
 * precedence.
 */
export function FunctionType(props: Readonly<FunctionTypeProps>) {
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
