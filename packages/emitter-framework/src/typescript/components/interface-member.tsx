import * as ts from "@alloy-js/typescript";
import { isNeverType, ModelProperty, Operation } from "@typespec/compiler";
import { getHttpPart } from "@typespec/http";
import { useTsp } from "../../core/context/tsp-context.js";
import { InterfaceMethod } from "./interface-method.jsx";
import { TypeExpression } from "./type-expression.js";

export interface InterfaceMemberProps {
  type: ModelProperty | Operation;
  optional?: boolean;
}

export function InterfaceMember(props: InterfaceMemberProps) {
  const { $ } = useTsp();
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
    return <InterfaceMethod type={props.type} />;
  }
}
