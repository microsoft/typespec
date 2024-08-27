import { useTSNamePolicy } from "@alloy-js/typescript";
import { ModelProperty, Operation } from "@typespec/compiler";
import { isModelProperty, isOperation } from "../../core/utils/typeguards.js";
import { FunctionDeclaration } from "./function-declaration.js";
import { TypeExpression } from "./type-expression.js";

export interface InterfaceMemberProps {
  type: ModelProperty | Operation;
  optional?: boolean;
}

export function InterfaceMember({ type, optional  }: InterfaceMemberProps) {
  const namer = useTSNamePolicy();
  const name = namer.getName(type.name, "object-member-getter");
  if (isModelProperty(type)) {
    const optionality = type.optional ?? optional ? "?" : "";

    return (
      <>
        "{name}"{optionality}: <TypeExpression type={type.type} />;
      </>
    );
  }

  if (isOperation(type)) {
    const returnType = <TypeExpression type={type.returnType} />;
    const params = <FunctionDeclaration.Parameters type={type.parameters} />;
    return (
      <>
        {name}({params}): {returnType};
      </>
    );
  }
}
