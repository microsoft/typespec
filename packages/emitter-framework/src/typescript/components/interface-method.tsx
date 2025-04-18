import { splitProps } from "@alloy-js/core/jsx-runtime";
import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface InterfaceMethodPropsWithType extends Omit<ts.InterfaceMethodProps, "name"> {
  type: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
}

export type InterfaceMethodProps = InterfaceMethodPropsWithType | ts.InterfaceMethodProps;

/**
 * A TypeScript interface method. Pass the `type` prop to create the
 * method by converting from a TypeSpec Operation. Any other props
 * provided will take precedence.
 */
export function InterfaceMethod(props: Readonly<InterfaceMethodProps>) {
  const isTypeSpecTyped = "type" in props;
  if (!isTypeSpecTyped) {
    return <ts.InterfaceMethod {...props} />;
  }

  const [efProps, updateProps, forwardProps] = splitProps(
    props,
    ["type"],
    ["returnType", "parameters"],
  );

  const name = props.name ?? ts.useTSNamePolicy().getName(efProps.type.name, "function");
  const returnType = props.returnType ?? <TypeExpression type={getReturnType(efProps.type)} />;
  const allParameters = buildParameterDescriptors(efProps.type.parameters, {
    params: props.parameters,
    mode: props.parametersMode,
  });

  return (
    <ts.InterfaceMethod
      {...forwardProps}
      {...updateProps}
      name={name}
      returnType={returnType}
      parameters={allParameters}
    />
  );
}
