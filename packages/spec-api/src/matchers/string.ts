import { createMatcher, err, type MockValueMatcher, ok } from "../match-engine.js";

export const stringMatcher = {
  caseInsensitive(value: string): MockValueMatcher<string> {
    const normalized = value.toLowerCase();
    return createMatcher({
      check(actual: unknown) {
        if (typeof actual !== "string") {
          return err(
            `match.string.caseInsensitive: expected a string but got ${typeof actual}`,
          );
        }
        if (actual.toLowerCase() !== normalized) {
          return err(
            `match.string.caseInsensitive: expected case-insensitive "${value}" but got "${actual}"`,
          );
        }
        return ok();
      },
      serialize() {
        return value;
      },
      toString() {
        return `match.string.caseInsensitive("${value}")`;
      },
    });
  },
};
