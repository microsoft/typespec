import { Experimental_OverridableComponent } from "#core/components/index.js";
import { useTsp } from "#core/context/tsp-context.js";
import { code, For, REFKEYABLE, type Children, type Refkey } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
import type { Enum, Union } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { getDocComments } from "../utils/doc-comments.jsx";
import { declarationRefkeys, efRefkey } from "../utils/refkey.js";

/** A single member of a generated C# enum. */
export interface EnumDeclarationMember {
  /** Member name, before the C# name policy is applied. */
  name: string;
  /** Refkey references to this member resolve to. */
  refkey?: Refkey;
  /** Doc comment for the member. */
  doc?: Children;
  /**
   * Name this member serializes to in JSON. Only used when
   * {@link EnumDeclarationProps.jsonAttributes} is set. Defaults to the member name.
   */
  jsonValue?: string;
}

export interface EnumDeclarationProps extends Omit<cs.EnumDeclarationProps, "name"> {
  name?: string;
  type: Union | Enum;
  /**
   * The members to render. Defaults to every member of the enum, or every variant of the
   * union.
   */
  members?: EnumDeclarationMember[];
  /**
   * If set the enum will add the json serialization attributes (using System.Text.Json):
   * `[JsonConverter(typeof(JsonStringEnumConverter))]` on the enum and
   * `[JsonStringEnumMemberName]` on each member.
   */
  jsonAttributes?: boolean;
}

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
  const { type: tspType, name, members, jsonAttributes, refkey, ...enumProps } = props;

  if (!tspType.name) {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: tspType });
  }
  const refkeys = declarationRefkeys(refkey, tspType)[0]; // TODO: support multiple refkeys for declarations in alloy
  const enumName = name ?? cs.useCSharpNamePolicy().getName(tspType.name!, "enum");
  const enumMembers = members ?? defaultMembers($, tspType);

  return (
    <>
      {jsonAttributes && (
        <>
          <cs.Attribute
            name={Serialization.JsonConverterAttribute[REFKEYABLE]()}
            args={[code`typeof(${Serialization.JsonStringEnumConverter[REFKEYABLE]()})`]}
          />
          <hbr />
        </>
      )}
      <cs.EnumDeclaration
        name={enumName}
        refkey={refkeys}
        doc={getDocComments($, tspType)}
        {...enumProps}
      >
        <For each={enumMembers} comma hardline>
          {(member) => (
            <>
              <cs.DocWhen doc={member.doc} />
              {jsonAttributes && (
                <>
                  <cs.Attribute
                    name={Serialization.JsonStringEnumMemberNameAttribute[REFKEYABLE]()}
                    args={[JSON.stringify(member.jsonValue ?? member.name)]}
                  />
                  <hbr />
                </>
              )}
              <cs.EnumMember
                name={cs.useCSharpNamePolicy().getName(member.name, "enum-member")}
                refkey={member.refkey}
              />
            </>
          )}
        </For>
      </cs.EnumDeclaration>
    </>
  );
}

function defaultMembers(
  $: ReturnType<typeof useTsp>["$"],
  tspType: Union | Enum,
): EnumDeclarationMember[] {
  let type: Enum;
  if ($.union.is(tspType)) {
    if (!$.union.isValidEnum(tspType)) {
      throw new Error("The provided union type cannot be represented as an enum");
    }
    type = $.enum.createFromUnion(tspType);
  } else {
    type = tspType;
  }

  return Array.from(type.members.entries()).map(([key, member]) => ({
    name: key,
    refkey: $.union.is(tspType) ? efRefkey(tspType.variants.get(key)) : efRefkey(member),
    doc: getDocComments($, member),
    jsonValue: typeof member.value === "string" ? member.value : key,
  }));
}
