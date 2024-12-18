import { useTSNamePolicy } from "@alloy-js/typescript";
import { isNeverType, ModelIndexer, ModelProperty, Operation } from "@typespec/compiler";
import { isOperation } from "../../core/utils/typeguards.js";
import { FunctionDeclaration } from "./function-declaration.js";
import { TypeExpression } from "./type-expression.js";
import { $ } from "@typespec/compiler/experimental/typekit";

export interface InterfaceMemberProps {
  type: ModelProperty | Operation | ModelIndexer;
  optional?: boolean;
}

export function InterfaceMember({ type, optional  }: InterfaceMemberProps) {

  if(isModelIndexer(type)) {
    return <>[key: {<TypeExpression type={type.key} />}]: unknown</>
  }

  const namer = useTSNamePolicy();
  const name = namer.getName(type.name, "object-member-getter")

  if ($.modelProperty.is(type)) {
    const optionality = type.optional ?? optional ? "?" : "";

    if(isNeverType(type.type)) {
      return null;
    }

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

function isModelIndexer(type: any): type is ModelIndexer {
  return !("type" in type);
}
