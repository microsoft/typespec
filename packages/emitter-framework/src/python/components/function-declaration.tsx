import { Operation } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";
import { DeclarationProps, mapJoin } from "@alloy-js/core";
import { usePythonNamePolicy } from "../name-policy.js";

export interface FunctionDeclarationProps extends DeclarationProps {
  type: Operation;
}

export function FunctionDeclaration(props: FunctionDeclarationProps) {
  const namer = usePythonNamePolicy();
  const functionName = props.name ?? namer.getName(props.type.name, "function");
  const signature = mapJoin(
    [...props.type.parameters.properties.values()],
    (param) => (
      <>
        {param.name}: <TypeExpression type={param.type} />
      </>
    ),
    { joiner: ", " }
  );
  return (
    <>
      def {functionName}({signature}):
        {props.children}
    </>
  );
}
