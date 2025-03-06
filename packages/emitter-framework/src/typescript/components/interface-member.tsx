import { useTSNamePolicy } from "@alloy-js/typescript";
import { isNeverType, ModelProperty, Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getHttpPart } from "@typespec/http";
import { FunctionDeclaration } from "./function-declaration.js";
import { TypeExpression } from "./type-expression.js";

export interface InterfaceMemberProps {
  type: ModelProperty | Operation;
  optional?: boolean;
}

export function InterfaceMember({ type, optional }: InterfaceMemberProps) {
  const namer = useTSNamePolicy();
  const name = namer.getName(type.name, "object-member-getter");

  if ($.modelProperty.is(type)) {
    const optionality = optional === true || type.optional === true ? "?" : "";

    if (isNeverType(type.type)) {
      return null;
    }

    let unpackedType = type.type;
    const part = getHttpPart($.program, type.type);
    if (part) {
      unpackedType = part.type;
    }

    return <>
        "{name}"{optionality}: <TypeExpression type={unpackedType} />;
      </>;
  }

  if ($.operation.is(type)) {
    const returnType = <TypeExpression type={type.returnType} />;
    const params = <FunctionDeclaration.Parameters type={type.parameters} />;
    return <>
        {name}({params}): {returnType};
      </>;
  }
}
