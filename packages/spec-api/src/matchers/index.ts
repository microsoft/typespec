import { dateTimeMatcher } from "./datetime.js";
import { baseUrlMatcher } from "./local-url.js";

export {
  createMatcher,
  err,
  isMatcher,
  MatcherSymbol,
  matchValues,
  ok,
  type MatcherConfig,
  type MatchResult,
  type MockValueMatcher,
} from "../match-engine.js";
export { dateTimeMatcher } from "./datetime.js";

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
   * match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z") // rejects offsets, only Z
   * match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT")
   * ```
   */
  dateTime: dateTimeMatcher,

  /**
   * Matcher for URL values that include the server's base URL.
   *
   * The matcher is created with just the path portion. At runtime, `expandDyns()`
   * resolves it by injecting the server's actual base URL (e.g. `http://localhost:3000`).
   * The resolved matcher validates that the actual value equals `baseUrl + path`.
   *
   * @example
   * ```ts
   * match.localUrl("/payload/pageable/next-page")
   * ```
   */
  localUrl: baseUrlMatcher,
};
