import { Children, refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Interface, Model, ModelProperty, Operation, RekeyableMap } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { createRekeyableMap } from "@typespec/compiler/utils";
import { reportDiagnostic } from "../../lib.js";
import { InterfaceMember } from "./interface-member.js";
import { TypeExpression } from "./type-expression.jsx";
export interface TypedInterfaceDeclarationProps extends Omit<ts.InterfaceDeclarationProps, "name"> {
  type: Model | Interface;
  name?: string;
}

export type InterfaceDeclarationProps =
  | TypedInterfaceDeclarationProps
  | ts.InterfaceDeclarationProps;

export function InterfaceDeclaration(props: InterfaceDeclarationProps) {
  if (!isTypedInterfaceDeclarationProps(props)) {
    return <ts.InterfaceDeclaration {...props} />;
  }

  const namePolicy = ts.useTSNamePolicy();

  let name = props.name ?? props.type.name;

  if (!name || name === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }

  name = namePolicy.getName(name, "interface");

  const refkey = props.refkey ?? getRefkey(props.type);

  const extendsType = props.extends ?? getExtendsType(props.type);

  const members = props.type ? membersFromType(props.type) : [];

  const children = [...members];

  if (Array.isArray(props.children)) {
    children.push(...props.children);
  } else if (props.children) {
    children.push(props.children);
  }

  return <ts.InterfaceDeclaration
      default={props.default}
      export={props.export}
      kind={props.kind}
      name={name}
      refkey={refkey}
      extends={extendsType}
    >
      {children}
    </ts.InterfaceDeclaration>;
}

function isTypedInterfaceDeclarationProps(
  props: InterfaceDeclarationProps,
): props is TypedInterfaceDeclarationProps {
  return "type" in props;
}

export interface InterfaceExpressionProps extends ts.InterfaceExpressionProps {
  type: Model | Interface;
}

export function InterfaceExpression({ type, children }: InterfaceExpressionProps) {
  const members = type ? membersFromType(type) : [];

  return <>
      {"{"}
      {members}
      {children}
      {"}"}
    </>;
}

function getExtendsType(type: Model | Interface): Children | undefined {
  if (!$.model.is(type)) {
    return undefined;
  }

  const extending: Children[] = [];

  if (type.baseModel) {
    if ($.array.is(type.baseModel)) {
      extending.push(<TypeExpression type={type.baseModel} />);
    } else if ($.record.is(type.baseModel)) {
      // Here we are in the additional properties land.
      // Instead of extending we need to create an envelope property
      // do nothing here.
    } else {
      extending.push(getRefkey(type.baseModel));
    }
  }

  const spreadType = $.model.getSpreadType(type);
  if (spreadType) {
    // When extending a record we need to override the element type to be unknown to avoid type errors
    if ($.record.is(spreadType)) {
      // Here we are in the additional properties land.
      // Instead of extending we need to create an envelope property
      // do nothing here.
    } else {
      extending.push(<TypeExpression type={spreadType} />);
    }
  }

  if (extending.length === 0) {
    return undefined;
  }

  return mapJoin(extending, (ext) => ext, { joiner: "," });
}

function membersFromType(type: Model | Interface) {
  let typeMembers: RekeyableMap<string, ModelProperty | Operation> | undefined;
  if ($.model.is(type)) {
    typeMembers = $.model.getProperties(type);
    const additionalProperties = $.model.getAdditionalPropertiesRecord(type);
    if (additionalProperties) {
      typeMembers.set(
        "additionalProperties",
        $.modelProperty.create({
          name: "additionalProperties",
          optional: true,
          type: additionalProperties,
        }),
      );
    }
  } else {
    typeMembers = createRekeyableMap(type.operations);
  }

  return mapJoin(typeMembers, (_, prop) => <InterfaceMember type={prop} />, {
    joiner: "\n",
  });
}
