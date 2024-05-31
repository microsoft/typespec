// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

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
  categorize: (o: T) => K
): Partial<Record<K, T[]>> {
  const result: Record<K, T[]> = {} as any;

  for (const value of values) {
    (result[categorize(value)] ??= []).push(value);
  }

  return result;
}
