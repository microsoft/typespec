import { refkey as getRefkey, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Interface, Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { isInterface, isModel } from "../../core/utils/typeguards.js";
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
  const { type, ...coreProps } = props;

  const name = coreProps.name ?? namePolicy.getName(type.name, "class");
  const refkey = coreProps.refkey ?? getRefkey(type);

  let extendsType = coreProps.extends;

  if (!extendsType && type.kind === "Model" && type.baseModel) {
    extendsType = <ts.Reference refkey={getRefkey(type.baseModel)} />;
  }

  const members = type ? membersFromType(type) : [];

  return (
    <ts.InterfaceDeclaration {...coreProps} name={name} refkey={refkey} extends={extendsType}>
      {members}{coreProps.children}
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

  return <>
    {"{"}
      {members}{children}
    {"}"}
  </>
}


function membersFromType(type: Type) {
  let typeMembers: IterableIterator<ModelProperty | Operation> | undefined;
  if (isModel(type)) {
    typeMembers = type.properties.values();
  } else if (isInterface(type)) {
    typeMembers = type.operations.values();
  } else {
    throw new Error("NYI");
  }

  return mapJoin(Array.from(typeMembers), (prop) => (
    <InterfaceMember type={prop} />
  ), { joiner: "\n" });
}
