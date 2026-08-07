import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import {
  type Enum,
  type Namespace as TspNamespace,
  type Type,
  type Union,
} from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import {
  EnumDeclaration as EfEnumDeclaration,
  getDocComments,
  type EnumDeclarationMember,
} from "@typespec/emitter-framework/csharp";
import { getSubNamespaceParts } from "../../utils/namespace-utils.js";
import { CSharpFile } from "../csharp-file.jsx";
import { efRefkey } from "../type-expression/type-expression.jsx";

/** Normalized declaration info that abstracts over `Enum` and union-as-enum types. */
interface EnumInfo {
  name: string;
  type: Enum | Union;
  namespace: TspNamespace | undefined;
  members: EnumDeclarationMember[];
}

function normalizeEnum($: ReturnType<typeof useTsp>["$"], en: Enum): EnumInfo {
  return {
    name: en.name,
    type: en,
    namespace: en.namespace,
    members: Array.from(en.members.entries()).map(([key, member]) => ({
      name: key,
      jsonValue: typeof member.value === "string" ? member.value : key,
      doc: getDocComments($, member),
    })),
  };
}

function normalizeUnionEnum($: ReturnType<typeof useTsp>["$"], union: Union): EnumInfo {
  return {
    name: union.name!,
    type: union,
    namespace: union.namespace,
    members: getUnionEnumMembers(union).map(({ name, value, variant }) => ({
      name,
      jsonValue: value,
      doc: getDocComments($, variant),
      refkey: efRefkey(union, name),
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
    ...props.enums.map((en) => normalizeEnum($, en)),
    ...props.unionEnums.map((union) => normalizeUnionEnum($, union)),
  ];

  return (
    <For each={allEnums}>
      {(info) => {
        const subNsParts = getSubNamespaceParts(info.namespace, props.serviceNamespace);

        const enumDecl = (
          <EfEnumDeclaration
            type={info.type}
            name={cs.useCSharpNamePolicy().getName(info.name, "enum")}
            refkey={efRefkey(info.type)}
            public
            members={info.members}
            jsonAttributes
          />
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
 * Returns true if an anonymous inline union contains only string literal variants.
 */
function isInlineStringLiteralUnion(type: Type): boolean {
  if (type.kind !== "Union" || type.name) return false;
  for (const variant of type.variants.values()) {
    if (variant.type.kind !== "String") return false;
  }
  return type.variants.size > 0;
}

/**
 * Returns true if a named union can be represented as a C# enum.
 * Requires: named union, every named variant has a string value,
 * and optionally one unnamed scalar `string` variant (open/extensible)
 * and/or a `null` variant. Also supports inline anonymous unions of
 * string literals (e.g., `"a" | "b" | "c"` as a single variant).
 */
export function isUnionEnum(union: Union): boolean {
  if (!union.name) return false;

  const variants = Array.from(union.variants.values());
  let hasStringVariant = false;

  for (const variant of variants) {
    // Allow a single open string scalar variant (extensible union)
    if (variant.type.kind === "Scalar" && variant.type.name === "string") {
      continue;
    }
    // Allow null variant (nullable union)
    if (variant.type.kind === "Intrinsic" && variant.type.name === "null") {
      continue;
    }
    // Named variant with a string literal value
    if (variant.type.kind === "String" && variant.name && typeof variant.name === "string") {
      hasStringVariant = true;
      continue;
    }
    // Unnamed variant with a string literal value (e.g., union { "low", "medium", "high" })
    if (variant.type.kind === "String" && typeof variant.name === "symbol") {
      hasStringVariant = true;
      continue;
    }
    // Inline anonymous union of string literals (e.g., "a" | "b" | "c" as a single variant)
    if (isInlineStringLiteralUnion(variant.type)) {
      hasStringVariant = true;
      continue;
    }
    // Any other variant type means it's not a simple enum
    return false;
  }

  return hasStringVariant;
}

/** Gets the named string variants of a union-as-enum (skipping the open `string` and `null` variants). */
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
      // Named variant with explicit key (e.g., none: "none")
      members.push({ name: variant.name, value: variant.type.value, variant });
    } else if (variant.type.kind === "String" && typeof variant.name === "symbol") {
      // Unnamed string literal variant (e.g., "none") — derive name from the value
      members.push({ name: variant.type.value, value: variant.type.value, variant });
    } else if (isInlineStringLiteralUnion(variant.type)) {
      // Inline anonymous union of string literals — flatten into individual members
      for (const innerVariant of (variant.type as Union).variants.values()) {
        if (innerVariant.type.kind === "String") {
          members.push({
            name: innerVariant.type.value,
            value: innerVariant.type.value,
            variant: innerVariant,
          });
        }
      }
    }
  }
  return members;
}
