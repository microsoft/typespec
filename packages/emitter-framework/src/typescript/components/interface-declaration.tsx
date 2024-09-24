import { refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Interface, Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { InterfaceMember } from "./interface-member.js";

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

  let name = props.name;

  if (!name) {
    const typeName = $.model.is(props.type) ? $.type.getPlausibleName(props.type) : props.type.name;
    name = namePolicy.getName(typeName, "interface");
  }

  const refkey = props.refkey ?? getRefkey(props.type);

  let extendsType = props.extends;

  if (!extendsType && $.model.is(props.type) && props.type.baseModel) {
    extendsType = <ts.Reference refkey={getRefkey(props.type.baseModel)} />;
  }

  const members = props.type ? membersFromType(props.type) : [];

  const children = [...members];

  if(Array.isArray(props.children)) {
    children.push(...props.children);
  } else if (props.children) {
    children.push(props.children);
  }

  return (
    <ts.InterfaceDeclaration
      default={props.default}
      export={props.export}
      kind={props.kind}
      name={name}
      refkey={refkey}
      extends={extendsType}
    >
      {children}
    </ts.InterfaceDeclaration>
  );
}

function isTypedInterfaceDeclarationProps(
  props: InterfaceDeclarationProps
): props is TypedInterfaceDeclarationProps {
  return "type" in props;
}

export interface InterfaceExpressionProps extends ts.InterfaceExpressionProps {
  type: Model | Interface;
}

export function InterfaceExpression({ type, children }: InterfaceExpressionProps) {
  const members = type ? membersFromType(type) : [];

  return (
    <>
      {"{"}
      {members}
      {children}
      {"}"}
    </>
  );
}

function membersFromType(type: Model | Interface) {
  let typeMembers: IterableIterator<ModelProperty | Operation> | undefined;
  if ($.model.is(type)) {
    typeMembers = type.properties.values();
  } else {
    typeMembers = type.operations.values();
  }

  return mapJoin(Array.from(typeMembers), (prop) => <InterfaceMember type={prop} />, {
    joiner: "\n",
  });
}
