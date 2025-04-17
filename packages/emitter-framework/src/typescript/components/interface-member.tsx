import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { isNeverType, ModelProperty, Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getHttpPart } from "@typespec/http";
import { FunctionDeclaration } from "./function-declaration.js";
import { TypeExpression } from "./type-expression.js";

export interface InterfaceMemberProps {
  type: ModelProperty | Operation;
  optional?: boolean;
}

export function InterfaceMember(props: InterfaceMemberProps) {
  const namer = ts.useTSNamePolicy();
  const name = namer.getName(props.type.name, "object-member-getter");

  if ($.modelProperty.is(props.type)) {
    if (isNeverType(props.type.type)) {
      return null;
    }

    let unpackedType = props.type.type;
    const part = getHttpPart($.program, props.type.type);
    if (part) {
      unpackedType = part.type;
    }

    return (
      <ts.InterfaceMember
        name={name}
        optional={props.optional ?? props.type.optional}
        type={<TypeExpression type={unpackedType} />}
      />
    );
  }

  if ($.operation.is(props.type)) {
    const returnType = <TypeExpression type={props.type.returnType} />;
    const params = (
      <ay.Scope>
        <FunctionDeclaration.Parameters type={props.type.parameters} />
      </ay.Scope>
    );

    return (
      <ts.InterfaceMember
        name={name}
        type={
          <>
            ({params}) =&gt {returnType}
          </>
        }
      />
    );
  }
}
