import * as ts from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

export interface ClassMethodPropsWithType extends Omit<ts.ClassMethodProps, "name"> {
  type: Operation;
  name?: string;
  parametersMode?: "prepend" | "append" | "replace";
}

export type ClassMethodProps = ClassMethodPropsWithType | ts.ClassMethodProps;

export function ClassMethod(props: ClassMethodProps) {
  if (!isTypedMethodDeclarationProps(props)) {
    return <ts.ClassMethod {...props} />;
  }

  const name = props.name ? props.name : ts.useTSNamePolicy().getName(props.type.name, "function");
  const returnType =
    props.returnType === null ? undefined : <TypeExpression type={getReturnType(props.type)} />;

  return (
    <ts.ClassMethod
      refkey={props.refkey}
      name={name}
      async={props.async}
      returnType={returnType}
      parameters={buildParameterDescriptors(props.type.parameters, {
        params: props.parameters,
        mode: props.parametersMode,
      })}
    >
      {props.children}
    </ts.ClassMethod>
  );
}

function isTypedMethodDeclarationProps(props: ClassMethodProps): props is ClassMethodPropsWithType {
  return (props as ClassMethodPropsWithType).type !== undefined;
}
