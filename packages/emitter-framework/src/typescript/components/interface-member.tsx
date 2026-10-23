import { type Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { isNeverType, type ModelProperty, type Operation } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { InterfaceMethod } from "./interface-method.jsx";
import { TypeExpression } from "./type-expression.js";

/** TypeSpec source for one interface property or method. Overrides apply to property rendering. */
export interface InterfaceMemberProps {
  /** Property to render, or operation delegated to {@link InterfaceMethod}. */
  type: ModelProperty | Operation;
  /** Property documentation override; defaults to the source property's documentation. */
  doc?: Children;
  /** Property optionality override; otherwise preserves the source property's optionality. */
  optional?: boolean;
}

/** Renders a property or method signature, omitting properties whose type is `never`. */
export function InterfaceMember(props: InterfaceMemberProps) {
  const { $ } = useTsp();
  const namer = ts.useTSNamePolicy();
  const name = namer.getName(props.type.name, "object-member-getter");
  const doc = props.doc ?? $.type.getDoc(props.type);

  if ($.modelProperty.is(props.type)) {
    if (isNeverType(props.type.type)) {
      return null;
    }

    const unpackedType = props.type.type;

    const interfaceMemberProps = {
      doc,
      name,
      optional: props.optional ?? props.type.optional,
      type: <TypeExpression type={unpackedType} />,
    };
    return <ts.InterfaceMember {...interfaceMemberProps} />;
  }

  if ($.operation.is(props.type)) {
    return <InterfaceMethod type={props.type} />;
  }
}
