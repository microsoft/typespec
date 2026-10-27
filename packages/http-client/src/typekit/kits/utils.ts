import type { Type } from "@typespec/compiler";
import { UsageFlags } from "@typespec/compiler";
import type { InternalClient } from "../../interfaces.js";

/** Shared client-visibility query inherited by the model, property, and operation kits. */
export interface AccessKit<T extends Type> {
  /**
   * Gets client visibility for a type; current implementations always return `"public"`.
   */
  getAccess(type: T): "public" | "internal";
}

/** Shared input/output usage query inherited by client data-type kits. */
export interface UsageKit<T extends Type> {
  /**
   * Gets client usage flags; currently returns both input and output rather than inferred usage.
   */
  getUsage(type: T): UsageFlags;
}

/** Shared naming query for compiler types and synthesized client descriptors. */
export interface NameKit<T extends Type | InternalClient> {
  /**
   * Gets the source type's name or the client descriptor's synthesized name.
   * Current implementations do not apply decorator-based name overrides.
   */
  getName(type: T): string;
}

export function getAccess(type: Type): "public" | "internal" {
  return "public";
}

export function getUsage(type: Type): UsageFlags {
  return UsageFlags.Input | UsageFlags.Output;
}

export function getName(type: Type): string {
  switch (type.kind) {
    case "Model":
    case "ModelProperty":
    case "Enum":
    case "Operation":
    case "Namespace":
    case "Interface":
      return type.name;
    default:
      throw new Error(
        "You shouldn't add getName as a type kit to an object with no name property.",
      );
  }
}
