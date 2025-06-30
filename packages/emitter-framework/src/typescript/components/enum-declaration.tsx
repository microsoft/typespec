import { type Children, For, type Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";
import { declarationRefkeys, efRefkey } from "../utils/refkey.js";

export interface EnumDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  name?: string;
  type: Union | Enum;
}

export function EnumDeclaration(props: EnumDeclarationProps) {
  const { $ } = useTsp();
  let type: Enum;
  if ($.union.is(props.type)) {
    if (!$.union.isValidEnum(props.type)) {
      throw new Error("The provided union type cannot be represented as an enum");
    }
    type = $.enum.createFromUnion(props.type);
  } else {
    type = props.type;
  }

  if (!props.type.name || props.type.name === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }
  const refkeys = declarationRefkeys(props.refkey, props.type);
  const name = props.name ?? ts.useTSNamePolicy().getName(props.type.name!, "enum");
  const members = Array.from(type.members.entries());
  const doc = props.doc ?? $.type.getDoc(type);

  return (
    <ts.EnumDeclaration
      doc={doc}
      name={name}
      refkey={refkeys}
      default={props.default}
      export={props.export}
    >
      <For each={members} joiner={",\n"}>
        {([key, value]) => {
          const memberDoc = $.type.getDoc(value);
          return (
            <EnumMember
              doc={memberDoc}
              type={value}
              refkey={
                $.union.is(props.type) ? efRefkey(props.type.variants.get(key)) : efRefkey(value)
              }
            />
          );
        }}
      </For>
    </ts.EnumDeclaration>
  );
}

export interface EnumMemberProps {
  type: TspEnumMember;
  doc?: Children;
  refkey?: Refkey;
}

export function EnumMember(props: EnumMemberProps) {
  return (
    <ts.EnumMember
      doc={props.doc}
      name={props.type.name}
      jsValue={props.type.value ?? props.type.name}
      refkey={props.refkey}
    />
  );
}
