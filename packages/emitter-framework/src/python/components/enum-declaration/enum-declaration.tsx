import { useTsp } from "#core/context/index.js";
import { type Children, For, Prose } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Enum, EnumMember as TspEnumMember, Union } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys, efRefkey } from "../../utils/refkey.js";
import { EnumMember } from "./enum-member.js";

export interface EnumDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  name?: string;
  type: Union | Enum;
  /**
   * Additional base classes to include in the class declaration.
   * These are rendered before the enum base type in the class signature.
   * For example, to render `class Foo(str, Enum, metaclass=Meta):`,
   * pass `extraBases={["str"]}` and `keywords={{ metaclass: metaRef }}`.
   */
  extraBases?: Children[];
  /**
   * Keyword arguments for the class declaration (e.g., `metaclass=CaseInsensitiveEnumMeta`).
   * Each key-value pair is rendered as `key=value` after the base classes.
   */
  keywords?: Record<string, Children>;
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

  // When extraBases or keywords are provided, use ClassDeclaration with
  // explicit bases instead of ClassEnumDeclaration (which only supports
  // a single base type from the enum module).
  if (props.extraBases || props.keywords) {
    const bases: Children[] = [...(props.extraBases ?? [])];
    bases.push(py.enumModule["."][enumType]);
    if (props.keywords) {
      for (const [key, value] of Object.entries(props.keywords)) {
        bases.push(<>{key}={value}</>);
      }
    }

    return (
      <py.ClassDeclaration doc={docElement} name={name} refkey={refkeys} bases={bases}>
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
      </py.ClassDeclaration>
    );
  }

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
