import {
  resolveEncodedEnumMemberValue,
  type Enum,
  type EnumMember,
  type Program,
} from "@typespec/compiler";

/**
 * Value a member is declared with, `undefined` for `auto()`. Once a member of the enum has an
 * `application/json` encoded name, every member gets the value it is serialized as: `auto()` beside
 * a string value fails at import on Python 3.13 and later.
 */
export function getEnumMemberValue(
  program: Program,
  member: EnumMember,
): string | number | undefined {
  // A member from `$.enumMember.create` has no enum until one is built from it.
  return member.enum && hasEncodedMember(program, member.enum)
    ? resolveEncodedEnumMemberValue(program, member, "application/json")
    : member.value;
}

const encodedEnums = new WeakMap<Enum, boolean>();

function hasEncodedMember(program: Program, type: Enum): boolean {
  let encoded = encodedEnums.get(type);
  if (encoded === undefined) {
    encoded = [...type.members.values()].some(
      (member) =>
        resolveEncodedEnumMemberValue(program, member, "application/json") !==
        (member.value ?? member.name),
    );
    encodedEnums.set(type, encoded);
  }
  return encoded;
}
