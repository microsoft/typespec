import { useDeclarationProvider } from "#core/context/declaration-provider.js";
import { joinRefkeys } from "#typescript/utils/refkey.js";
import { type Children, For, type Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../lib.js";

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
  const dp = useDeclarationProvider();
  const refkeys = joinRefkeys(props.refkey, dp.getRefkey(props.type));
  const members = type.members.values();
  const doc = props.doc ?? $.type.getDoc(type);

  return (
    <ts.EnumDeclaration
      doc={doc}
      name={props.type.name!}
      refkey={refkeys}
      default={props.default}
      export={props.export}
    >
      <For each={members} joiner={",\n"}>
        {(member) => {
          const memberDoc = $.type.getDoc(member);

          const originalMember = $.union.is(props.type)
            ? props.type.variants.get(member.name)!
            : member;

          return (
            <EnumMember
              doc={memberDoc}
              type={member}
              refkey={dp.getStaticMemberRefkey(originalMember)}
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
