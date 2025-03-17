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
 * Concatenate multiple iterables into a single iterable.
 */
export function* cat<T>(...iterables: Iterable<T>[]): Iterable<T> {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

/**
 * Filter and collect an iterable into multiple groups based on a categorization function.
 *
 * The categorization function returns a string key for each value, and the values are returned in an object where each
 * key is a category returned by the categorization function and the value is an array of values in that category.
 *
 * @param values - an iterable of values to categorize
 * @param categorize - a categorization function that returns a string key for each value
 * @returns an object where each key is a category and the value is an array of values in that category
 */

export function categorize<T, K extends string>(
  values: Iterable<T>,
  categorize: (o: T) => K,
): Partial<Record<K, T[]>> {
  const result: Record<K, T[]> = {} as any;

  for (const value of values) {
    (result[categorize(value)] ??= []).push(value);
  }

  return result;
}

/**
 * Filter and collect an iterable into two categorizations based on a predicate function.
 *
 * Items for which the predicate returns true will be returned in the first array.
 * Items for which the predicate returns false will be returned in the second array.
 *
 * @param values - an iterable of values to filter
 * @param predicate - a predicate function that decides whether a value should be included in the first or second array
 *
 * @returns a tuple of two arrays of values filtered by the predicate
 */
export function bifilter<T>(values: Iterable<T>, predicate: (o: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (const value of values) {
    if (predicate(value)) {
      pass.push(value);
    } else {
      fail.push(value);
    }
  }

  return [pass, fail];
}

/**
 * Prepends a string `indentation` to each value in `values`.
 *
 * @param values - an iterable of strings to indent
 * @param indentation - the string to prepend to the beginning of each value
 */
export function* indent(values: Iterable<string>, indentation: string = "  "): Iterable<string> {
  for (const value of values) {
    yield indentation + value;
  }
}
