import { HttpOperation } from "@typespec/http";

/**
 * Checks if two objects are deeply equal.
 *
 * Does not support cycles. Intended to be used only on plain data that can
 * be directly represented in JSON.
 */
export function deepEquals(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  if (Array.isArray(left)) {
    return Array.isArray(right) ? arrayEquals(left, right, deepEquals) : false;
  }
  return mapEquals(new Map(Object.entries(left)), new Map(Object.entries(right)), deepEquals);
}

export type EqualityComparer<T> = (x: T, y: T) => boolean;

/**
 * Check if two arrays have the same elements.
 *
 * @param equals Optional callback for element equality comparison.
 *               Default is to compare by identity using `===`.
 */
export function arrayEquals<T>(
  left: T[],
  right: T[],
  equals: EqualityComparer<T> = (x, y) => x === y
): boolean {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (!equals(left[i], right[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if two maps have the same entries.
 *
 * @param equals Optional callback for value equality comparison.
 *               Default is to compare by identity using `===`.
 */
export function mapEquals<K, V>(
  left: Map<K, V>,
  right: Map<K, V>,
  equals: EqualityComparer<V> = (x, y) => x === y
): boolean {
  if (left === right) {
    return true;
  }
  if (left.size !== right.size) {
    return false;
  }
  for (const [key, value] of left) {
    if (!right.has(key) || !equals(value, right.get(key)!)) {
      return false;
    }
  }
  return true;
}
/**
 * Check if argument is not undefined.
 */
export function isDefined<T>(arg: T | undefined): arg is T {
  return arg !== undefined;
}

export interface SharedHttpOperation {
  kind: "shared";
  operations: HttpOperation[];
}
export function isSharedHttpOperation(
  operation: HttpOperation | SharedHttpOperation
): operation is SharedHttpOperation {
  return (operation as SharedHttpOperation).kind === "shared";
}
