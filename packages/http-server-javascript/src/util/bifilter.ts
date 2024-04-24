/**
 * Filter and collect an iterable into two categorizations based on a predicate functions.
 *
 * Items for which the predicate returns true will be returned in the first array.
 * Items for which the predicate returns false will be returned in the second array.
 *
 * @param values - an iterable of values to filter
 * @param predicate - a predicate function that decides whether a value should be included in the first or second array
 *
 * @returns a tuple of two arrays of values filtered by the predicate
 */
export function bifilter<T>(
  values: Iterable<T>,
  predicate: (o: T) => boolean
): [T[], T[]] {
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
