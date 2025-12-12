import { useTsp } from "#core/context/index.js";
import { type Children, For, Prose, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys, efRefkey } from "../../utils/refkey.js";

export interface EnumDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  name?: string;
  type: Union | Enum;
}

// Determine the appropriate enum type based on the member values
function determineEnumType(
  members: Array<[string, TspEnumMember]>,
): "IntEnum" | "StrEnum" | "Enum" {
  const allInteger = members.every(([, member]) => {
    const value = member.value;
    return typeof value === "number" && Number.isInteger(value);
  });

  const allString = members.every(([, member]) => {
    const value = member.value;
    return typeof value === "string";
  });

  if (allInteger) {
    return "IntEnum";
  } else if (allString) {
    return "StrEnum";
  } else {
    return "Enum";
  }
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

  if (!props.type.name) {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }
  const refkeys = declarationRefkeys(props.refkey, props.type);
  const name = props.name ?? py.usePythonNamePolicy().getName(props.type.name!, "enum");
  const members = Array.from(type.members.entries());
  const doc = props.doc ?? $.type.getDoc(type);
  const docElement = doc ? <py.ClassDoc description={[<Prose>{doc}</Prose>]} /> : undefined;
  const enumType = determineEnumType(members);

  return (
    <py.ClassEnumDeclaration doc={docElement} name={name} refkey={refkeys} baseType={enumType}>
      <For each={members} joiner={"\n"}>
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
    </py.ClassEnumDeclaration>
  );
}

export interface EnumMemberProps {
  type: TspEnumMember;
  doc?: Children;
  refkey?: Refkey;
}

export function EnumMember(props: EnumMemberProps) {
  return (
    <py.EnumMember
      doc={props.doc}
      name={props.type.name}
      jsValue={props.type.value}
      refkey={props.refkey}
      auto={props.type.value === undefined}
    />
  );
}
