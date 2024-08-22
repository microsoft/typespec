import { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import * as ts from "@alloy-js/typescript";
import { mapJoin, Refkey, refkey } from "@alloy-js/core";

export interface EnumDeclarationProps extends Omit<ts.TypeDeclarationProps, "name">{
  name?: string;
  type: Union | Enum;
}

export function EnumDeclaration(props: EnumDeclarationProps) {
  let type: Enum;
  if ($.union.is(props.type)) {
    if (!$.union.isValidEnum(props.type)) {
      throw new Error("The provided union type cannot be represented as an enum");
    }
    type = $.enum.createFromUnion(props.type);
  } else {
    type = props.type;
  }

  const members = mapJoin(type.members, (key, value) => {
    return <EnumMember
      type={value}
      refkey={$.union.is(props.type)
        ? refkey(props.type.variants.get(key))
        : refkey(value)
      } />
  }, { joiner: ",\n" });


  return <ts.EnumDeclaration
    name={props.name ?? type.name}
    refkey={refkey(props.type)}
    default={props.default}
    export={props.export}
  >
    { members }
  </ts.EnumDeclaration>
}

export interface EnumMemberProps {
  type: TspEnumMember;
  refkey?: Refkey;
}

export function EnumMember(props: EnumMemberProps) {
  return <ts.EnumMember
    name={props.type.name}
    jsValue={props.type.value ?? props.type.name}
    refkey={refkey(props.refkey ?? props.type)}
  />
}
