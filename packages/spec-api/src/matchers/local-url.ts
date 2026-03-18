import {
  createMatcher,
  err,
  type MatchResult,
  type MockValueMatcher,
  ok,
} from "../match-engine.js";
import type { ResolverConfig } from "../types.js";

/**
 * A MockValueMatcher that also carries a `resolve` method.
 * Before resolution, `check()` performs a loose path-suffix validation.
 * After resolution via `expandDyns`, the returned matcher does exact equality.
 */
export interface ResolvableMockValueMatcher<T = unknown> extends MockValueMatcher<T> {
  resolve(config: ResolverConfig): MockValueMatcher<T>;
}

export function baseUrlMatcher(path: string): ResolvableMockValueMatcher<string> {
  return {
    ...createMatcher({
      check(actual: unknown): MatchResult {
        if (typeof actual !== "string") {
          return err(
            `match.localUrl: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
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
    }),
    resolve(config: ResolverConfig): MockValueMatcher<string> {
      const expected = config.baseUrl + path;
      return createMatcher({
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
      });
    },
  };
}
