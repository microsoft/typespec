import {
  resolveEncodedEnumMemberValue,
  type Enum,
  type EnumMember,
  type Program,
} from "@typespec/compiler";

/**
 * Value a member is declared with, `undefined` for `auto()`. Once a member of the enum has an
 * `application/json` encoded name, every member gets the value it is serialized as: `auto()` beside
 * a string value fails at import.
 */
export function getEnumMemberValue(
  program: Program,
  member: EnumMember,
): string | number | undefined {
  return hasEncodedMember(program, member.enum)
    ? resolveEncodedEnumMemberValue(program, member, "application/json")
    : member.value;
}

function hasEncodedMember(program: Program, type: Enum): boolean {
  return [...type.members.values()].some(
    (member) =>
      resolveEncodedEnumMemberValue(program, member, "application/json") !==
      (member.value ?? member.name),
  );
}
