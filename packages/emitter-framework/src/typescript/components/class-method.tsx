import * as ts from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { buildParameterDescriptors, getReturnType } from "../utils/operation.js";
import { TypeExpression } from "./type-expression.jsx";

/** Operation-backed class method options; the operation determines the generated signature. */
export interface ClassMethodPropsWithType extends Omit<ts.ClassMethodProps, "name"> {
  /** Operation supplying parameters and return type, filtering error variants only from unions. */
  type: Operation;
  /** Method name override; otherwise the operation name uses the TypeScript function naming policy. */
  name?: string;
  /** Explicit parameters precede generated ones by default; append or replace them instead. */
  parametersMode?: "prepend" | "append" | "replace";
}

/** Either an operation-backed method or unmodified Alloy class-method props. */
export type ClassMethodProps = ClassMethodPropsWithType | ts.ClassMethodProps;

/**
 * Renders an operation-backed method, or delegates directly to Alloy without `type`.
 * For a typed method, `returnType={null}` suppresses the return annotation; otherwise
 * it is derived from the operation. Children supply the body.
 */
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
