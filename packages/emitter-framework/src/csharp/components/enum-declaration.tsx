import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Enum, Union } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { reportDiagnostic } from "../../lib.js";
import { declarationRefkeys, efRefkey } from "./utils/refkey.js";

export interface EnumDeclarationProps extends Omit<cs.EnumProps, "name"> {
  name?: string;
  type: Union | Enum;
}

export function EnumDeclaration(props: EnumDeclarationProps): ay.Children {
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
  const refkeys = declarationRefkeys(props.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy
  const name = props.name ?? cs.useCSharpNamePolicy().getName(props.type.name!, "enum");
  const members = Array.from(type.members.entries());

  return (
    <cs.Enum name={name} refkey={refkeys} accessModifier={props.accessModifier ?? "public"}>
      <ay.For each={members} joiner={",\n"}>
        {([key, value]) => {
          return (
            <cs.EnumMember
              name={cs.useCSharpNamePolicy().getName(key, "enum-member")}
              refkey={
                $.union.is(props.type) ? efRefkey(props.type.variants.get(key)) : efRefkey(value)
              }
            />
          );
        }}
      </ay.For>
    </cs.Enum>
  );
}
