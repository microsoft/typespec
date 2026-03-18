import { err, MatcherSymbol, type MatchResult, type MockValueMatcher, ok } from "./matchers.js";
import type { ResolverConfig } from "./types.js";

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
  return {
    [MatcherSymbol]: true,
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
    toJSON(): string {
      return value;
    },
    toString(): string {
      return `${label}(${value})`;
    },
  };
}

/**
 * A MockValueMatcher that also carries a `resolve` method.
 * Before resolution, `check()` performs a loose path-suffix validation.
 * After resolution via `expandDyns`, the returned matcher does exact equality.
 */
export interface ResolvableMockValueMatcher<T = unknown> extends MockValueMatcher<T> {
  resolve(config: ResolverConfig): MockValueMatcher<T>;
}

function createBaseUrlMatcher(path: string): ResolvableMockValueMatcher<string> {
  return {
    [MatcherSymbol]: true,
    resolve(config: ResolverConfig): MockValueMatcher<string> {
      const expected = config.baseUrl + path;
      return {
        [MatcherSymbol]: true,
        check(actual: unknown): MatchResult {
          if (typeof actual !== "string") {
            return err(
              `match.baseUrl: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
            );
          }
          if (actual !== expected) {
            return err(`match.baseUrl: expected "${expected}" but got "${actual}"`);
          }
          return ok();
        },
        toJSON(): string {
          return expected;
        },
        toString(): string {
          return `match.baseUrl("${path}")`;
        },
      };
    },
    check(actual: unknown): MatchResult {
      if (typeof actual !== "string") {
        return err(
          `match.baseUrl: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
        );
      }
      if (!actual.endsWith(path)) {
        return err(`match.baseUrl: expected URL ending with "${path}" but got "${actual}"`);
      }
      return ok();
    },
    toJSON(): string {
      return path;
    },
    toString(): string {
      return `match.baseUrl("${path}")`;
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
      return createDateTimeMatcher(value, "match.dateTime.rfc3339", "rfc3339", rfc3339Pattern);
    },
    rfc7231(value: string): MockValueMatcher<string> {
      return createDateTimeMatcher(value, "match.dateTime.rfc7231", "rfc7231", rfc7231Pattern);
    },
  },

  /**
   * Matcher for URL values that include the server's base URL.
   *
   * The matcher is created with just the path portion. At runtime, `expandDyns()`
   * resolves it by injecting the server's actual base URL (e.g. `http://localhost:3000`).
   * The resolved matcher validates that the actual value equals `baseUrl + path`.
   *
   * Works in both request validation (via `check()`) and response serialization (via `toJSON()`).
   *
   * @example
   * ```ts
   * match.baseUrl("/payload/pageable/next-page")
   * // After resolution with baseUrl "http://localhost:3000":
   * // check("http://localhost:3000/payload/pageable/next-page") → pass
   * // toJSON() → "http://localhost:3000/payload/pageable/next-page"
   * ```
   */
  baseUrl(path: string): ResolvableMockValueMatcher<string> {
    return createBaseUrlMatcher(path);
  },
};
