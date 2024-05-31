// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * Returns true if a value implements the ECMAScript Iterable interface.
 */
export function isIterable(value: unknown): value is object & Iterable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.iterator in value &&
    typeof (value as Iterable<unknown>)[Symbol.iterator] === "function"
  );
}

/**
 * Joins multiple iterables into a single iterable.
 */
export function* join<T>(...iterables: Iterable<T>[]): Iterable<T> {
  for (const iterable of iterables) {
    yield* iterable;
  }
}
