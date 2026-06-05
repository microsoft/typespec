import { createMatcher, err, type MockValueMatcher, ok } from "../match-engine.js";

export const booleanMatcher = {
  caseInsensitiveString(value: boolean): MockValueMatcher<string> {
    const normalized = String(value);
    return createMatcher({
      check(actual: unknown) {
        if (typeof actual !== "string") {
          return err(
            `match.boolean.caseInsensitiveString: expected a string but got ${typeof actual} (${JSON.stringify(actual)})`,
          );
        }
        if (actual.toLowerCase() !== normalized) {
          return err(
            `match.boolean.caseInsensitiveString: expected case-insensitive "${normalized}" but got "${actual}"`,
          );
        }
        return ok();
      },
      serialize() {
        return normalized;
      },
      toString() {
        return `match.boolean.caseInsensitiveString(${normalized})`;
      },
    });
  },
};
