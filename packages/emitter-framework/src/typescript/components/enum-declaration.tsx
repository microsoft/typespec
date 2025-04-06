import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { reportDiagnostic } from "../../lib.js";
import { reportTypescriptDiagnostic } from "../lib.js";

export interface EnumDeclarationProps extends Omit<ts.TypeDeclarationProps, "name"> {
  name?: string;
  type: Union | Enum;
}

export function EnumDeclaration(props: EnumDeclarationProps) {
  if (!props.type.name || props.type.name === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }

  let type: Enum;

  if ($.union.is(props.type)) {
    if (!$.union.isValidEnum(props.type)) {
      reportTypescriptDiagnostic($.program, {
        code: "invalid-enum-type",
        target: props.type,
      });
    }
    type = $.enum.createFromUnion(props.type);
  } else {
    type = props.type;
  }

  const name = props.name ?? ts.useTSNamePolicy().getName(props.type.name!, "enum");
  const members = Array.from(type.members.entries());

  return (
    <ts.EnumDeclaration
      name={name}
      refkey={ay.refkey(props.type)}
      default={props.default}
      export={props.export}
    >
      <ay.For each={members} joiner={",\n"}>
        {([key, value]) => {
          return (
            <EnumMember
              type={value}
              refkey={
                $.union.is(props.type) ? ay.refkey(props.type.variants.get(key)) : ay.refkey(value)
              }
            />
          );
        }}
      </ay.For>
    </ts.EnumDeclaration>
  );
}

export interface EnumMemberProps {
  type: TspEnumMember;
  refkey?: ay.Refkey;
}

export function EnumMember(props: EnumMemberProps) {
  return (
    <ts.EnumMember
      name={props.type.name}
      jsValue={props.type.value ?? props.type.name}
      refkey={ay.refkey(props.refkey ?? props.type)}
    />
  );
}
