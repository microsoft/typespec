import { Type, UsageFlags } from "@typespec/compiler";
import { InternalClient } from "../../interfaces.js";

export interface AccessKit<T extends Type> {
  /**
   * Gets the access of a type
   */
  getAccess(type: T): "public" | "internal";
}

export interface UsageKit<T extends Type> {
  /**
   * Gets the usage of a type
   */
  getUsage(type: T): UsageFlags;
}

export interface NameKit<T extends Type | InternalClient> {
  /**
   * Gets the name of a type, with @clientName decorator applied
   */
  getName(type: T): string;
}

export function getAccess(type: Type): "public" | "internal" {
  return "public";
}

export function getUsage(type: Type): UsageFlags {
  return UsageFlags.Input | UsageFlags.Output;
}

type TypeWithName = Type & {
  name: string;
};

export function getName(type: TypeWithName): string {
  return type.name;
}
