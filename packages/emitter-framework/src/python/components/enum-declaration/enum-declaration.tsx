import { useTsp } from "#core/context/index.js";
import { For, Prose } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Enum, Program, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys, efRefkey } from "../../utils/refkey.js";
import { EnumMember } from "./enum-member.js";
import { getEnumMemberValue } from "./member-value.js";

/** Enum source and declaration overrides for a generated Python enum class. */
export interface EnumDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  /** Explicit class name; otherwise applies the Python enum naming policy to the source name. */
  name?: string;
  /** Enum or enum-compatible union; incompatible unions throw during rendering. */
  type: Union | Enum;
}

// Determine the appropriate enum type based on the member values
function determineEnumType(
  program: Program,
  members: Array<[string, TspEnumMember]>,
): "IntEnum" | "StrEnum" | "Enum" {
  const allInteger = members.every(([, member]) => {
    const value = getEnumMemberValue(program, member);
    return typeof value === "number" && Number.isInteger(value);
  });

  const allString = members.every(([, member]) => {
    const value = getEnumMemberValue(program, member);
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

/**
 * Declares an IntEnum for all-integer values, StrEnum for all-string values, or Enum otherwise.
 * If any member has a JSON encoded value, every member uses its resolved JSON value;
 * otherwise unset values use `auto()`. Preserves source documentation and reference identities.
 * Requires a TypeSpec render context.
 */
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
  const enumType = determineEnumType($.program, members);

  return (
    <py.ClassEnumDeclaration doc={docElement} name={name} refkey={refkeys} baseType={enumType}>
      <For each={members} hardline>
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
