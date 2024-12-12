import { Type, UsageFlags } from "@typespec/compiler";
import { Client } from "../../interfaces.js";

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

export interface NameKit<T extends Type | Client> {
  /**
   * Gets the name of a type, with @clientName decorator applied
   */
  getName(type: T): string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAccess(type: Type): "public" | "internal" {
  return "public";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
