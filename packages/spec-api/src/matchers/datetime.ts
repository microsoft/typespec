import {
  createMatcher,
  err,
  type MatchResult,
  type MockValueMatcher,
  ok,
} from "../match-engine.js";

const rfc3339Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/i;
const rfc7231Pattern =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s\d{2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT$/i;

function createDateTimeMatcher(
  value: string,
  label: string,
  formatName: string,
  formatPattern: RegExp,
): MockValueMatcher<string> {
  const expectedMs = Date.parse(value);
  if (isNaN(expectedMs)) {
    throw new Error(`${label}: invalid datetime value: ${value}`);
  }
  return createMatcher({
    check(actual: unknown): MatchResult {
      if (typeof actual !== "string") {
        return err(
          `${label}: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
        );
      }
      if (!formatPattern.test(actual)) {
        return err(`${label}: expected ${formatName} format but got "${actual}"`);
      }
      const actualMs = Date.parse(actual);
      if (isNaN(actualMs)) {
        return err(
          `${label}: value "${actual}" matches ${formatName} format but is not a valid date`,
        );
      }
      if (actualMs !== expectedMs) {
        return err(
          `${label}: timestamps differ — expected ${new Date(expectedMs).toISOString()} but got ${new Date(actualMs).toISOString()}`,
        );
      }
      return ok();
    },
    serialize(): string {
      return value;
    },
    toString(): string {
      return `${label}(${value})`;
    },
  });
}

export const dateTimeMatcher = {
  rfc3339(value: string): MockValueMatcher<string> {
    return createDateTimeMatcher(value, "match.dateTime.rfc3339", "rfc3339", rfc3339Pattern);
  },
  rfc7231(value: string): MockValueMatcher<string> {
    return createDateTimeMatcher(value, "match.dateTime.rfc7231", "rfc7231", rfc7231Pattern);
  },
};
