import { useTsp } from "#core/context/index.js";
import { type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import {
  resolveEncodedEnumMemberValue,
  type EnumMember as TspEnumMember,
} from "@typespec/compiler";

export interface EnumMemberProps {
  type: TspEnumMember;
  doc?: Children;
  refkey?: Refkey;
}

export function EnumMember(props: EnumMemberProps) {
  const { $ } = useTsp();
  return (
    <py.EnumMember
      doc={props.doc}
      name={props.type.name}
      jsValue={resolveEncodedEnumMemberValue($.program, props.type, "application/json")}
      refkey={props.refkey}
    />
  );
}
