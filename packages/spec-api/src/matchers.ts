/**
 * Matcher framework for Spector mock API validation.
 *
 * Matchers are special objects that can be placed anywhere in an expected value tree.
 * The comparison engine recognizes them and delegates to `matcher.check(actual)`
 * instead of doing strict equality — enabling flexible comparisons for types like
 * datetime that serialize differently across languages.
 */

/** Symbol used to identify matcher objects */
export const MatcherSymbol: unique symbol = Symbol.for("SpectorMatcher");

/**
 * Interface for custom value matchers.
 * Implement this to create new matcher types.
 */
export interface MockValueMatcher<T = unknown> {
  readonly [MatcherSymbol]: true;
  /** Check whether the actual value matches the expectation */
  check(actual: unknown): boolean;
  /** The raw value to use when serializing (e.g., in JSON.stringify) */
  toJSON(): T;
  /** Human-readable description for error messages */
  toString(): string;
}

/** Type guard to check if a value is a MockValueMatcher */
export function isMatcher(value: unknown): value is MockValueMatcher {
  return (
    typeof value === "object" &&
    value !== null &&
    MatcherSymbol in value &&
    (value as any)[MatcherSymbol] === true
  );
}

/**
 * Recursively compares actual vs expected values.
 * When a MockValueMatcher is encountered in the expected tree, delegates to matcher.check().
 * Otherwise uses strict equality semantics (same as deep-equal with strict: true).
 *
 * @returns `true` if values match, `false` otherwise
 */
export function matchValues(actual: unknown, expected: unknown): boolean {
  if (expected === actual) {
    return true;
  }

  if (isMatcher(expected)) {
    return expected.check(actual);
  }

  if (typeof expected !== typeof actual) {
    return false;
  }

  if (expected === null || actual === null) {
    return false;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return false;
    }
    if (expected.length !== actual.length) {
      return false;
    }
    return expected.every((item, index) => matchValues(actual[index], item));
  }

  if (Buffer.isBuffer(expected)) {
    return Buffer.isBuffer(actual) && expected.equals(actual);
  }

  if (typeof expected === "object") {
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;

    const expectedKeys = Object.keys(expectedObj);
    const actualKeys = Object.keys(actualObj);

    if (expectedKeys.length !== actualKeys.length) {
      return false;
    }

    return expectedKeys.every(
      (key) => key in actualObj && matchValues(actualObj[key], expectedObj[key]),
    );
  }

  return false;
}
