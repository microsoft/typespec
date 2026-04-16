import type {
  DecoratedType,
  DecoratorContext,
  DecoratorFunction,
  Model,
  ModelProperty,
  Operation,
  Type,
  Union,
} from "@typespec/compiler";
import { NAMESPACE } from "../lib.js";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

/**
 * Decorator implementation for `@nullable`.
 *
 * No-op — the decorator's presence on the type's `decorators` array is the
 * signal. No additional state storage is needed.
 */
export const $nullable: DecoratorFunction = (
  _context: DecoratorContext,
  _target: ModelProperty | Operation | Union | Model,
) => {};

/**
 * Decorator implementation for `@nullableElements`.
 *
 * No-op — presence on the decorators array is the signal.
 */
export const $nullableElements: DecoratorFunction = (
  _context: DecoratorContext,
  _target: ModelProperty | Operation,
) => {};

/**
 * Check whether a type was marked nullable after null-variant stripping.
 *
 * Marked on different targets depending on context:
 * - **ModelProperty**: inline `T | null` (can't mark the shared scalar singleton)
 * - **Operation**: return type `T | null`
 * - **Union**: named unions like `Cat | Dog | null` (safe — new unique object)
 */
export function isNullable(type: Type): boolean {
  if (!isDecoratedType(type)) return false;
  return type.decorators.some((d) => d.decorator === $nullable);
}

/**
 * Mark a type, property, or operation as nullable.
 * Called by the mutation engine when null variants are stripped.
 */
export function setNullable(type: Type): void {
  if (!isDecoratedType(type)) return;
  if (type.decorators.some((d) => d.decorator === $nullable)) return;
  type.decorators.push({ decorator: $nullable, args: [] });
}

/**
 * Check whether a property's array elements were originally `T | null`.
 *
 * For `(string | null)[]`, marks the ModelProperty so components emit
 * `[String]` instead of `[String!]`.
 */
export function hasNullableElements(type: Type): boolean {
  if (!isDecoratedType(type)) return false;
  return type.decorators.some((d) => d.decorator === $nullableElements);
}

/** Mark a property as having nullable array elements. */
export function setNullableElements(type: Type): void {
  if (!isDecoratedType(type)) return;
  if (type.decorators.some((d) => d.decorator === $nullableElements)) return;
  type.decorators.push({ decorator: $nullableElements, args: [] });
}

function isDecoratedType(type: Type): type is Type & DecoratedType {
  return "decorators" in type;
}
