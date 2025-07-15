import { Block, type Children, For, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  type Interface,
  isNeverType,
  type Model,
  type ModelProperty,
  type Operation,
  type RekeyableMap,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { createRekeyableMap } from "@typespec/compiler/utils";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";
import { declarationRefkeys, efRefkey } from "../utils/refkey.js";
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
  const { $ } = useTsp();

  if (!isTypedInterfaceDeclarationProps(props)) {
    return <ts.InterfaceDeclaration {...props} />;
  }

  const namePolicy = ts.useTSNamePolicy();

  let name = props.name ?? props.type.name;

  if (!name || name === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }

  name = namePolicy.getName(name, "interface");

  const refkeys = declarationRefkeys(props.refkey, props.type);

  const extendsType = props.extends ?? getExtendsType($, props.type);
  const doc = props.doc ?? $.type.getDoc(props.type);

  return (
    <ts.InterfaceDeclaration
      doc={doc}
      default={props.default}
      export={props.export}
      kind={props.kind}
      name={name}
      refkey={refkeys}
      extends={extendsType}
    >
      <InterfaceBody {...props} />
    </ts.InterfaceDeclaration>
  );
}

function isTypedInterfaceDeclarationProps(
  props: InterfaceDeclarationProps,
): props is TypedInterfaceDeclarationProps {
  return "type" in props;
}

export interface InterfaceExpressionProps extends ts.InterfaceExpressionProps {
  type: Model | Interface;
}

export function InterfaceExpression(props: InterfaceExpressionProps) {
  return (
    <Block>
      <InterfaceBody {...props} />
    </Block>
  );
}

function getExtendsType($: Typekit, type: Model | Interface): Children | undefined {
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
      extending.push(efRefkey(type.baseModel));
    }
  }

  const indexType = $.model.getIndexType(type);
  if (indexType) {
    // When extending a record we need to override the element type to be unknown to avoid type errors
    if ($.record.is(indexType)) {
      // Here we are in the additional properties land.
      // Instead of extending we need to create an envelope property
      // do nothing here.
    } else {
      extending.push(<TypeExpression type={indexType} />);
    }
  }

  if (extending.length === 0) {
    return undefined;
  }

  return mapJoin(
    () => extending,
    (ext) => ext,
    { joiner: "," },
  );
}

/**
 * Renders the members of an interface from its properties, including any additional children.
 */
function InterfaceBody(props: TypedInterfaceDeclarationProps): Children {
  const { $ } = useTsp();
  let typeMembers: RekeyableMap<string, ModelProperty | Operation> | undefined;
  if ($.model.is(props.type)) {
    typeMembers = $.model.getProperties(props.type);
    const additionalProperties = $.model.getAdditionalPropertiesRecord(props.type);
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
    typeMembers = createRekeyableMap(props.type.operations);
  }

  // Ensure that we have members to render, otherwise skip rendering the ender property.
  const validTypeMembers = Array.from(typeMembers.values()).filter((member) => {
    if ($.modelProperty.is(member) && isNeverType(member.type)) {
      return false;
    }
    return true;
  });
  const enderProp = validTypeMembers.length > 0 ? { ender: ";" } : {};

  return (
    <>
      <For each={validTypeMembers} semicolon line {...enderProp}>
        {(typeMember) => {
          return <InterfaceMember type={typeMember} />;
        }}
      </For>
      {props.children}
    </>
  );
}
