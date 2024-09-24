import * as ts from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import {refkey as getRefkey} from "@alloy-js/core"
import { TypeExpression } from "./type-expression.jsx";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";

export interface ClassMethodPropsWithType extends Omit<ts.ClassMethodProps, "name"> {
  type: Operation;
  name?: string;
}

export type ClassMethodProps = ClassMethodPropsWithType | ts.ClassMethodProps;

export function ClassMethod(props: ClassMethodProps) {
  if (!isTypedMethodDeclarationProps(props)) {
    return <ts.ClassMethod {...props} />;
  }

  const refkey = props.refkey ?? getRefkey(props.type, "method");

  const name = props.name ? props.name : ts.useTSNamePolicy().getName(props.type.name, "function");
  const returnType = props.returnType ?? <TypeExpression type={getReturnType(props.type)} />;

  return <ts.ClassMethod
    refkey={refkey}
    name={name}
    async={props.async}
    returnType={returnType}
    parameters={buildParameterDescriptors(props.type.parameters)}
   >
    {props.children}
   </ts.ClassMethod>
}

  function isTypedMethodDeclarationProps(props: ClassMethodProps): props is ClassMethodPropsWithType {
    return (props as ClassMethodPropsWithType).type !== undefined;
  }
