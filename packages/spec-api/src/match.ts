import { type MockValueMatcher, MatcherSymbol } from "./matchers.js";

const rfc3339Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/i;
const rfc7231Pattern =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s\d{2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT$/i;

function createDateTimeMatcher(
  value: string,
  label: string,
  formatPattern: RegExp,
): MockValueMatcher<string> {
  const expectedMs = Date.parse(value);
  if (isNaN(expectedMs)) {
    throw new Error(`${label}: invalid datetime value: ${value}`);
  }
  return {
    [MatcherSymbol]: true,
    check(actual: unknown): boolean {
      if (typeof actual !== "string") {
        return false;
      }
      if (!formatPattern.test(actual)) {
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
      return `${label}(${value})`;
    },
  };
}

/**
 * Namespace for built-in matchers.
 */
export const match = {
  /**
   * Matchers for comparing datetime values semantically.
   * Validates that the actual value is in the correct format and represents
   * the same point in time as the expected value.
   *
   * @example
   * ```ts
   * match.dateTime.rfc3339("2022-08-26T18:38:00.000Z")
   * match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT")
   * ```
   */
  dateTime: {
    rfc3339(value: string): MockValueMatcher<string> {
      return createDateTimeMatcher(value, "match.dateTime.rfc3339", rfc3339Pattern);
    },
    rfc7231(value: string): MockValueMatcher<string> {
      return createDateTimeMatcher(value, "match.dateTime.rfc7231", rfc7231Pattern);
    },
  },
};
