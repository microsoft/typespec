import type { Type, Union } from "@typespec/compiler";

export type NamedType = Type & { name: string };

export function isNamedUnion(union: Union): union is Union & { name: string } {
  return union.name !== undefined;
}

export function isMapLike(value: any): value is Map<string, any> {
  return "entries" in value && typeof value.entries === "function";
}
