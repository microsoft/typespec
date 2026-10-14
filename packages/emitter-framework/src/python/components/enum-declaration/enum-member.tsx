import { useTsp } from "#core/context/index.js";
import { type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { EnumMember as TspEnumMember } from "@typespec/compiler";
import { getEnumMemberValue } from "./member-value.js";

export interface EnumMemberProps {
  type: TspEnumMember;
  doc?: Children;
  refkey?: Refkey;
}

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
