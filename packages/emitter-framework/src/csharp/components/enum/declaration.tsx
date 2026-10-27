import { Experimental_OverridableComponent, useTsp } from "#core/index.js";
import { type Children, For } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import type { Enum, Union } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { getDocComments } from "../utils/doc-comments.jsx";
import { declarationRefkeys, efRefkey } from "../utils/refkey.js";

/** TypeSpec enum source and Alloy options for a C# enum declaration. */
export interface EnumDeclarationProps extends Omit<cs.EnumDeclarationProps, "name"> {
  /** Explicit declaration name; otherwise the C# naming policy is applied to the source name. */
  name?: string;
  /** Enum or enum-compatible union. An incompatible union throws during rendering. */
  type: Union | Enum;
}

/**
 * Declares a C# enum, deriving members and documentation from an enum or compatible union.
 * Member names use the C# naming policy; source numeric and string values are not emitted
 * as explicit C# values. Supports declaration overrides and requires a TypeSpec context.
 */
export function EnumDeclaration(props: EnumDeclarationProps): Children {
  return (
    <Experimental_OverridableComponent
      declaration
      type={props.type}
      Declaration={EnumDeclarationBody}
      declarationProps={props}
    >
      <EnumDeclarationBody {...props} />
    </Experimental_OverridableComponent>
  );
}

function EnumDeclarationBody(props: EnumDeclarationProps): Children {
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
    <>
      <cs.EnumDeclaration name={name} refkey={refkeys} {...props} doc={getDocComments($, type)}>
        <For each={members} joiner={",\n"}>
          {([key, value]) => {
            return (
              <>
                <cs.DocWhen doc={getDocComments($, value)} />
                <cs.EnumMember
                  name={cs.useCSharpNamePolicy().getName(key, "enum-member")}
                  refkey={
                    $.union.is(props.type)
                      ? efRefkey(props.type.variants.get(key))
                      : efRefkey(value)
                  }
                />
              </>
            );
          }}
        </For>
      </cs.EnumDeclaration>
    </>
  );
}
