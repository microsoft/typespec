import { refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {  Interface, Model, ModelIndexer, ModelProperty, Operation, RekeyableMap, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { InterfaceMember } from "./interface-member.js";
import { TypeExpression } from "./type-expression.jsx";
import {createRekeyableMap} from "@typespec/compiler/utils"
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
    
    if($.array.is(props.type.baseModel) || $.record.is(props.type.baseModel)) {
      extendsType = <TypeExpression type={props.type.baseModel} />;
    } else {
      extendsType = getRefkey(props.type.baseModel)
    }
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
  let typeMembers: RekeyableMap<string, ModelProperty | Operation | ModelIndexer> | undefined;
  if ($.model.is(type)) {
    typeMembers = type.properties
    if(type.indexer) {
      typeMembers.set("indexer", type.indexer)
    }
  } else {
    typeMembers = type.operations
  }

  return mapJoin(typeMembers, (_, prop) => <InterfaceMember type={prop} />, {
    joiner: "\n",
  });
}
