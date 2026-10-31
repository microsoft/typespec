import type { Refkey } from "@alloy-js/core";
import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
import {
  resolveEncodedEnumMemberValue,
  type Enum,
  type EnumMember,
  type Program,
  type Namespace as TspNamespace,
  type Type,
  type Union,
} from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { getDocComments } from "@typespec/emitter-framework/csharp";
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

function normalizeEnum(program: Program, en: Enum): EnumInfo {
  return {
    name: en.name,
    type: en,
    namespace: en.namespace,
    members: Array.from(en.members.entries()).map(([key, value]) => ({
      name: key,
      serializedValue: serializedEnumMemberValue(program, value, key),
      docSource: value,
    })),
  };
}

/**
 * Value a member serializes to in json. A numeric member without an encoded name keeps its name,
 * as the enum is emitted with a string converter.
 */
function serializedEnumMemberValue(program: Program, member: EnumMember, key: string): string {
  const value = resolveEncodedEnumMemberValue(program, member, "application/json");
  return typeof value === "string" ? value : key;
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
    ...props.enums.map((en) => normalizeEnum($.program, en)),
    ...props.unionEnums.map(normalizeUnionEnum),
  ];

  return (
    <For each={allEnums}>
      {(info) => {
        const namePolicy = cs.useCSharpNamePolicy();
        const enumName = namePolicy.getName(info.name, "enum");
        const subNsParts = getSubNamespaceParts(info.namespace, props.serviceNamespace);

        const enumDecl = (
          <>
            <Attribute
              name={Serialization.JsonConverterAttribute}
              args={["typeof(JsonStringEnumConverter)"]}
            />
            <hbr />
            <cs.EnumDeclaration
              name={enumName}
              public
              refkey={efRefkey(info.type)}
              doc={getDocComments($, info.type)}
            >
              <For each={info.members} comma hardline>
                {(member) => (
                  <>
                    <cs.DocWhen doc={getDocComments($, member.docSource)} />
                    <Attribute
                      name={Serialization.JsonStringEnumMemberNameAttribute}
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
          <CSharpFile path={`${enumName}.cs`} using={["System.Text.Json"]}>
            {wrappedContent}
          </CSharpFile>
        );
      }}
    </For>
  );
}

type UnionEnumMember = {
  name: string;
  value: string;
  variant: import("@typespec/compiler").UnionVariant;
};

/**
 * Returns all string-literal members that can be flattened into a C# enum.
 *
 * A named union may include another named string union (for example, a service
 * provisioning state that includes the standard resource terminal states).
 * Keep the active path separate from sibling traversal so repeated references
 * remain valid while recursive unions are rejected.
 */
function getFlattenedUnionEnumMembers(
  union: Union,
  activeUnions = new Set<Union>(),
): UnionEnumMember[] | undefined {
  if (activeUnions.has(union)) return undefined;

  const nextActiveUnions = new Set(activeUnions);
  nextActiveUnions.add(union);
  const members: UnionEnumMember[] = [];
  const memberNames = new Map<string, string>();
  const memberValues = new Map<string, string>();
  const namePolicy = cs.createCSharpNamePolicy();

  for (const variant of union.variants.values()) {
    // Open-string and null variants do not produce enum members. They remain
    // part of the containing union's value space.
    if (
      (variant.type.kind === "Scalar" && variant.type.name === "string") ||
      (variant.type.kind === "Intrinsic" && variant.type.name === "null")
    ) {
      continue;
    }

    if (variant.type.kind === "String") {
      // An unnamed string literal (e.g., `"none"`) derives its member name
      // from its value; named variants retain their explicit name.
      const name = typeof variant.name === "string" ? variant.name : variant.type.value;
      const generatedName = namePolicy.getName(name, "enum-member");
      const existingValue = memberNames.get(generatedName);
      const existingName = memberValues.get(variant.type.value);

      // Identical members can be reached through multiple nested unions, but
      // conflicting names or values cannot be represented unambiguously in the
      // generated C# enum or its default-value references.
      if (
        (existingValue !== undefined && existingValue !== variant.type.value) ||
        (existingName !== undefined && existingName !== generatedName)
      ) {
        return undefined;
      }
      if (existingValue === undefined && existingName === undefined) {
        memberNames.set(generatedName, variant.type.value);
        memberValues.set(variant.type.value, generatedName);
        members.push({ name, value: variant.type.value, variant });
      }
      continue;
    }

    if (variant.type.kind === "Union") {
      // A named nested union variant (e.g. `Group: Inner`) is a reference to
      // the nested type, not an enum member. Keep the existing type-resolution
      // path instead of emitting an enum that has no `Group` member. Anonymous
      // inline literal unions (e.g. `Group: "a" | "b"`) are still flattened,
      // preserving the behavior supported before nested named unions were added.
      if (typeof variant.name === "string" && variant.type.name) return undefined;

      const nestedMembers = getFlattenedUnionEnumMembers(variant.type, nextActiveUnions);
      if (!nestedMembers) return undefined;
      for (const member of nestedMembers) {
        const generatedName = namePolicy.getName(member.name, "enum-member");
        const existingValue = memberNames.get(generatedName);
        const existingName = memberValues.get(member.value);
        if (
          (existingValue !== undefined && existingValue !== member.value) ||
          (existingName !== undefined && existingName !== generatedName)
        ) {
          return undefined;
        }
        if (existingValue === undefined && existingName === undefined) {
          memberNames.set(generatedName, member.value);
          memberValues.set(member.value, generatedName);
          members.push(member);
        }
      }
      continue;
    }

    return undefined;
  }

  return members;
}

/**
 * Returns true if a named union can be represented as a C# enum.
 * Supports direct or nested named string-literal unions, plus optional open
 * `string` and `null` variants.
 */
export function isUnionEnum(union: Union): boolean {
  return Boolean(union.name && getFlattenedUnionEnumMembers(union)?.length);
}

/** Whether a union-as-enum has a null variant and needs a nullable C# reference. */
export function isNullableUnionEnum(union: Union): boolean {
  const visited = new Set<Union>();
  const containsNull = (current: Union): boolean => {
    if (visited.has(current)) return false;
    visited.add(current);
    return Array.from(current.variants.values()).some((variant) => {
      if (variant.type.kind === "Intrinsic" && variant.type.name === "null") return true;
      return variant.type.kind === "Union" && containsNull(variant.type);
    });
  };

  return isUnionEnum(union) && containsNull(union);
}

/** Gets the string members of a union-as-enum, flattening nested named unions. */
export function getUnionEnumMembers(union: Union): UnionEnumMember[] {
  return getFlattenedUnionEnumMembers(union) ?? [];
}
