import { type MockValueMatcher, MatcherSymbol } from "./matchers.js";

/**
 * Namespace for built-in matchers.
 */
export const match = {
  /**
   * Creates a matcher that compares datetime values semantically.
   * Accepts any datetime string that represents the same point in time,
   * regardless of precision or timezone format.
   *
   * @example
   * ```ts
   * match.dateTime("2022-08-26T18:38:00.000Z")
   * // matches "2022-08-26T18:38:00Z"
   * // matches "2022-08-26T18:38:00.000Z"
   * // matches "2022-08-26T18:38:00.0000000Z"
   * ```
   */
  dateTime(value: string): MockValueMatcher<string> {
    const expectedMs = Date.parse(value);
    if (isNaN(expectedMs)) {
      throw new Error(`match.dateTime: invalid datetime value: ${value}`);
    }
    return {
      [MatcherSymbol]: true,
      check(actual: unknown): boolean {
        if (typeof actual !== "string") {
          return false;
        }
        const actualMs = Date.parse(actual);
        if (isNaN(actualMs)) {
          return false;
        }
        return actualMs === expectedMs;
      },
      toJSON(): string {
        return value;
      },
      toString(): string {
        return `match.dateTime(${value})`;
      },
    };
  },
};
