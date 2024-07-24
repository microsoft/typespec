import { refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Interface, Model, ModelProperty, Operation } from "@typespec/compiler";
import { isInterface, isModel } from "../../core/utils/typeguards.js";
import {
  InterfaceDeclaration as TsInterfaceDeclaration,
  InterfaceDeclarationProps as TsInterfaceDeclarationProps,
} from "./alloy-interface-declaration.js";
import { InterfaceExpressionProps as TsInterfaceExpressionProps } from "./alloy-interface-expression.js";
import { InterfaceMember } from "./interface-member.js";

export interface TypedInterfaceDeclarationProps extends Omit<TsInterfaceDeclarationProps, "name"> {
  type: Model | Interface;
  name?: string;
}

export type InterfaceDeclarationProps =
  | TypedInterfaceDeclarationProps
  | TsInterfaceDeclarationProps;

export function InterfaceDeclaration(props: InterfaceDeclarationProps) {
  if (!isTypedInterfaceDeclarationProps(props)) {
    return <TsInterfaceDeclaration {...props} />;
  }

  const namePolicy = ts.useTSNamePolicy();
  const { type, ...coreProps } = props;

  const name = coreProps.name ?? namePolicy.getName(type.name, "class");
  const refkey = coreProps.refkey ?? getRefkey(type);

  let extendsType = coreProps.extends;

  if (!extendsType && type.kind === "Model" && type.baseModel) {
    extendsType = <ts.Reference refkey={getRefkey(type.baseModel)} />;
  }


  return (
    <TsInterfaceDeclaration {...coreProps} name={name} refkey={refkey} extends={extendsType}>
      <InterfaceExpression type={type}>
        {coreProps.children}
        </InterfaceExpression>
    </TsInterfaceDeclaration>
  );
}

function isTypedInterfaceDeclarationProps(
  props: InterfaceDeclarationProps
): props is TypedInterfaceDeclarationProps {
  return "type" in props;
}

export interface InterfaceExpressionProps extends TsInterfaceExpressionProps {
  type: Model | Interface;
}

export function InterfaceExpression({ type, children }: InterfaceExpressionProps) {
  const members = [];
  let typeMembers: IterableIterator<ModelProperty | Operation> | undefined;
  // const [childrenMembers, children] = filterComponentFromChildren(allChildren, InterfaceMember);

  if (type) {
    if (isModel(type)) {
      typeMembers = type.properties.values();
    } else if (isInterface(type)) {
      typeMembers = type.operations.values();
    }

    for (const prop of typeMembers ?? []) {
      members.push(<InterfaceMember type={prop} />);
    }
  }


  return ["{\n", members  , children , "\n}"];
}
