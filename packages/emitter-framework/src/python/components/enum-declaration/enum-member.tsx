import { useTsp } from "#core/context/index.js";
import { type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { EnumMember as TspEnumMember } from "@typespec/compiler";
import { getEnumMemberValue } from "./member-value.js";

/** Inputs for one member inside a Python enum declaration. */
export interface EnumMemberProps {
  /** Source member supplying its name and resolved explicit/JSON-encoded value. */
  type: TspEnumMember;
  /** Documentation emitted with the member; unlike EnumDeclaration this component does not fetch it automatically. */
  doc?: Children;
  /** Optional identity for references to this member. */
  refkey?: Refkey;
}

/** Renders one enum member, using `auto()` only when its resolved value is undefined. */
export function EnumMember(props: EnumMemberProps) {
  const { $ } = useTsp();
  const value = getEnumMemberValue($.program, props.type);
  return (
    <py.EnumMember
      doc={props.doc}
      name={props.type.name}
      jsValue={value}
      refkey={props.refkey}
      auto={value === undefined}
    />
  );
}
