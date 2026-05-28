import type { Refkey } from "@alloy-js/core";
import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import {
  type Enum,
  type Namespace as TspNamespace,
  type Type,
  type Union,
} from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { JsonSerialization } from "../../utils/csharp-libs.jsx";
import { getDocComments } from "../../utils/doc-comments.jsx";
import { getSubNamespaceParts } from "../../utils/namespace-utils.js";
import { CSharpFile } from "../csharp-file.jsx";
import { efRefkey } from "../type-expression/type-expression.jsx";

/** Normalized member info shared by both enums and union-enums. */
interface EnumMemberInfo {
  name: string;
  serializedValue: string;
  docSource: Type;
  memberRefkey?: Refkey;
}

/** Normalized enum info that abstracts over Enum and union-as-enum types. */
interface EnumInfo {
  name: string;
  type: Enum | Union;
  namespace: TspNamespace | undefined;
  members: EnumMemberInfo[];
}

function normalizeEnum(en: Enum): EnumInfo {
  return {
    name: en.name,
    type: en,
    namespace: en.namespace,
    members: Array.from(en.members.entries()).map(([key, value]) => ({
      name: key,
      serializedValue: typeof value.value === "string" ? value.value : key,
      docSource: value,
    })),
  };
}

function normalizeUnionEnum(union: Union): EnumInfo {
  return {
    name: union.name!,
    type: union,
    namespace: union.namespace,
    members: getUnionEnumMembers(union).map(({ name, value, variant }) => ({
      name,
      serializedValue: value,
      docSource: variant,
      memberRefkey: efRefkey(union, name),
    })),
  };
}

export interface EnumsProps {
  /** Pre-resolved TypeSpec enums. */
  enums: Enum[];
  /** Pre-resolved union-as-enum types. */
  unionEnums: Union[];
  /** The service namespace for sub-namespace wrapping. */
  serviceNamespace: TspNamespace | undefined;
}

/**
 * Iterates pre-resolved enums and union-enums and emits C# enum declarations.
 * Each enum is emitted in its own source file with JSON serialization attributes.
 */
export function Enums(props: EnumsProps): Children {
  const { $ } = useTsp();

  const allEnums: EnumInfo[] = [
    ...props.enums.map(normalizeEnum),
    ...props.unionEnums.map(normalizeUnionEnum),
  ];

  return (
    <For each={allEnums}>
      {(info) => {
        const namePolicy = cs.useCSharpNamePolicy();
        const subNsParts = getSubNamespaceParts(info.namespace, props.serviceNamespace);

        const enumDecl = (
          <>
            <Attribute
              name={JsonSerialization.JsonConverterAttribute}
              args={["typeof(JsonStringEnumConverter)"]}
            />
            <hbr />
            <cs.EnumDeclaration
              name={namePolicy.getName(info.name, "enum")}
              public
              refkey={efRefkey(info.type)}
              doc={getDocComments($, info.type)}
            >
              <For each={info.members} comma hardline>
                {(member) => (
                  <>
                    <cs.DocWhen doc={getDocComments($, member.docSource)} />
                    <Attribute
                      name={JsonSerialization.JsonStringEnumMemberNameAttribute}
                      args={[`"${member.serializedValue}"`]}
                    />
                    <hbr />
                    <cs.EnumMember
                      name={namePolicy.getName(member.name, "enum-member")}
                      refkey={member.memberRefkey}
                    />
                  </>
                )}
              </For>
            </cs.EnumDeclaration>
          </>
        );

        const wrappedContent = subNsParts.reduceRight<Children>(
          (content, nsPart) => <cs.Namespace name={nsPart}>{content}</cs.Namespace>,
          enumDecl,
        );

        return (
          <CSharpFile path={`${info.name}.cs`} using={["System.Text.Json"]}>
            {wrappedContent}
          </CSharpFile>
        );
      }}
    </For>
  );
}

/**
 * Returns true if a named union can be represented as a C# enum.
 * Requires: named union, every named variant has a string value,
 * and optionally one unnamed scalar `string` variant (open/extensible).
 */
export function isUnionEnum(union: Union): boolean {
  if (!union.name) return false;

  const variants = Array.from(union.variants.values());
  let hasNamedStringVariant = false;

  for (const variant of variants) {
    // Allow a single open string scalar variant (extensible union)
    if (variant.type.kind === "Scalar" && variant.type.name === "string") {
      continue;
    }
    // Named variant with a string literal value
    if (variant.type.kind === "String" && variant.name && typeof variant.name === "string") {
      hasNamedStringVariant = true;
      continue;
    }
    // Any other variant type means it's not a simple enum
    return false;
  }

  return hasNamedStringVariant;
}

/** Gets the named string variants of a union-as-enum (skipping the open `string` variant). */
export function getUnionEnumMembers(
  union: Union,
): { name: string; value: string; variant: import("@typespec/compiler").UnionVariant }[] {
  const members: {
    name: string;
    value: string;
    variant: import("@typespec/compiler").UnionVariant;
  }[] = [];
  for (const variant of union.variants.values()) {
    if (variant.type.kind === "String" && variant.name && typeof variant.name === "string") {
      members.push({ name: variant.name, value: variant.type.value, variant });
    }
  }
  return members;
}
