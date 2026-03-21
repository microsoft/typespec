import { createMatcher, err, type MockValueMatcher, ok } from "../match-engine.js";

export function baseUrlMatcher(path: string): MockValueMatcher<string> {
  return createMatcher((config) => ({
    check(actual: unknown) {
      if (typeof actual !== "string") {
        return err(
          `match.localUrl: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
        );
      }
      const expected = config.baseUrl + path;
      if (actual !== expected) {
        return err(`match.localUrl: expected "${expected}" but got "${actual}"`);
      }
      return ok();
    },
    serialize() {
      return config.baseUrl + path;
    },
    toString() {
      return `match.localUrl("${path}")`;
    },
  }));
}
