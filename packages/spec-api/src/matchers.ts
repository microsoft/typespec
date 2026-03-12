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

/** Result of a match operation */
export type MatchResult = { pass: true } | { pass: false; message: string };

const OK: MatchResult = Object.freeze({ pass: true });

/** Create a passing match result */
export function ok(): MatchResult {
  return OK;
}

/** Create a failing match result with a message */
export function err(message: string): MatchResult {
  return { pass: false, message };
}

/**
 * Interface for custom value matchers.
 * Implement this to create new matcher types.
 */
export interface MockValueMatcher<T = unknown> {
  readonly [MatcherSymbol]: true;
  /** Check whether the actual value matches the expectation */
  check(actual: unknown): MatchResult;
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

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (Buffer.isBuffer(value)) return `Buffer(${value.length})`;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function pathErr(message: string, path: string): MatchResult {
  const prefix = path ? `at ${path}: ` : "";
  return err(`${prefix}${message}`);
}

/**
 * Recursively compares actual vs expected values.
 * When a MockValueMatcher is encountered in the expected tree, delegates to matcher.check().
 * Otherwise uses strict equality semantics (same as deep-equal with strict: true).
 */
export function matchValues(actual: unknown, expected: unknown, path: string = "$"): MatchResult {
  if (expected === actual) {
    return ok();
  }

  if (isMatcher(expected)) {
    const result = expected.check(actual);
    if (!result.pass) {
      return pathErr(result.message, path);
    }
    return result;
  }

  if (typeof expected !== typeof actual) {
    return pathErr(
      `Type mismatch: expected ${typeof expected} but got ${typeof actual} (${formatValue(actual)})`,
      path,
    );
  }

  if (expected === null || actual === null) {
    return pathErr(`Expected ${formatValue(expected)} but got ${formatValue(actual)}`, path);
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return pathErr(`Expected an array but got ${formatValue(actual)}`, path);
    }
    if (expected.length !== actual.length) {
      return pathErr(
        `Array length mismatch: expected ${expected.length} but got ${actual.length}`,
        path,
      );
    }
    for (let i = 0; i < expected.length; i++) {
      const result = matchValues(actual[i], expected[i], `${path}[${i}]`);
      if (!result.pass) {
        return result;
      }
    }
    return ok();
  }

  if (Buffer.isBuffer(expected)) {
    if (!Buffer.isBuffer(actual)) {
      return pathErr(`Expected a Buffer but got ${typeof actual}`, path);
    }
    if (!expected.equals(actual)) {
      return pathErr(`Buffer contents differ`, path);
    }
    return ok();
  }

  if (typeof expected === "object") {
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;

    const expectedKeys = Object.keys(expectedObj);
    const actualKeys = Object.keys(actualObj);

    if (expectedKeys.length !== actualKeys.length) {
      const missing = expectedKeys.filter((k) => !(k in actualObj));
      const extra = actualKeys.filter((k) => !(k in expectedObj));
      const parts: string[] = [
        `Key count mismatch: expected ${expectedKeys.length} but got ${actualKeys.length}`,
      ];
      if (missing.length > 0) parts.push(`missing: [${missing.join(", ")}]`);
      if (extra.length > 0) parts.push(`extra: [${extra.join(", ")}]`);
      return pathErr(parts.join(". "), path);
    }

    for (const key of expectedKeys) {
      if (!(key in actualObj)) {
        return pathErr(`Missing key "${key}"`, path);
      }
      const result = matchValues(actualObj[key], expectedObj[key], `${path}.${key}`);
      if (!result.pass) {
        return result;
      }
    }
    return ok();
  }

  return pathErr(`Expected ${formatValue(expected)} but got ${formatValue(actual)}`, path);
}
