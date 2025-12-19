import { type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { EnumMember as TspEnumMember } from "@typespec/compiler";

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
