import { fail, match, strictEqual } from "assert";
import { getSourceLocation } from "../core/diagnostics.js";
import { formatDiagnostic } from "../core/logger/console-sink.js";
import { NoTarget, type Diagnostic } from "../core/types.js";
import { isArray } from "../utils/misc.js";
import { resolveVirtualPath } from "./test-utils.js";

/**
 * Assert there is no diagnostics.
 * @param diagnostics Diagnostics
 */
export function expectDiagnosticEmpty(diagnostics: readonly Diagnostic[]) {
  if (diagnostics.length > 0) {
    fail(`Unexpected diagnostics:\n${formatDiagnostics(diagnostics)}`);
  }
}

function formatDiagnostics(diagnostics: readonly Diagnostic[]) {
  return diagnostics.map((x) => formatDiagnostic(x)).join("\n");
}
/**
 * Condition to match
 */
export interface DiagnosticMatch {
  /**
   * Match the code.
   */
  code?: string;

  /**
   * Match the message.
   */
  message?: string | RegExp;

  /**
   * Match the severity.
   */
  severity?: "error" | "warning";

  /**
   * Name of the file for this diagnostic.
   */
  file?: string | RegExp;

  /**
   * Start position of the diagnostic
   */
  pos?: number;

  /**
   * End position of the diagnostic
   */
  end?: number;
}

export interface ExpectDiagnosticsOptions {
  /** Require the number of diagnostics to match exactly. Defaults to true. */
  strict?: boolean;

  /** Require diagnostics to appear in the expected order. Defaults to true. */
  fixedOrder?: boolean;
}

/**
 * Validate the diagnostic array contains exactly the given diagnostics.
 * @param diagnostics Array of the diagnostics
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
  options: ExpectDiagnosticsOptions = {},
) {
  const array = isArray(match) ? match : [match];
  const strict = options.strict ?? true;
  const fixedOrder = options.fixedOrder ?? true;

  if ((strict && array.length !== diagnostics.length) || array.length > diagnostics.length) {
    fail(
      `Expected ${array.length} diagnostics but found ${diagnostics.length}:\n ${formatDiagnostics(
        diagnostics,
      )}`,
    );
  }

  if (!fixedOrder) {
    if (!hasUnorderedMatch(diagnostics, array)) {
      fail(
        `Could not match the expected diagnostics regardless of order:\n${formatDiagnostics(
          diagnostics,
        )}`,
      );
    }
    return;
  }

  for (let i = 0; i < array.length; i++) {
    const diagnostic = diagnostics[i];
    const expectation = array[i];
    const sep = "-".repeat(100);
    const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(diagnostics)}\n${sep}`;
    if (expectation.code !== undefined) {
      strictEqual(
        diagnostic.code,
        expectation.code,
        `Diagnostic at index ${i} has non matching code.\n${message}`,
      );
    }

    if (expectation.message !== undefined) {
      matchStrOrRegex(
        diagnostic.message,
        expectation.message,
        `Diagnostic at index ${i} has non matching message.\n${message}`,
      );
    }
    if (expectation.severity !== undefined) {
      strictEqual(
        diagnostic.severity,
        expectation.severity,
        `Diagnostic at index ${i} has non matching severity.\n${message}`,
      );
    }
    if (
      expectation.file !== undefined ||
      expectation.pos !== undefined ||
      expectation.end !== undefined
    ) {
      if (diagnostic.target === NoTarget) {
        fail(`Diagnostics at index ${i} expected to have a target.\n${message}`);
      }
      const source = getSourceLocation(diagnostic.target);

      if (expectation.file !== undefined) {
        matchStrOrRegex(
          source.file.path,
          typeof expectation.file === "string"
            ? resolveVirtualPath(expectation.file)
            : expectation.file,
          `Diagnostics at index ${i} has non matching file.\n${message}`,
        );
      }

      if (expectation.pos !== undefined) {
        strictEqual(
          source.pos,
          expectation.pos,
          `Diagnostic at index ${i} has non-matching start position.`,
        );
      }

      if (expectation.end !== undefined) {
        strictEqual(
          source.end,
          expectation.end,
          `Diagnostic at index ${i} has non-matching end position.`,
        );
      }
    }
  }
}

function hasUnorderedMatch(
  diagnostics: readonly Diagnostic[],
  expectations: readonly DiagnosticMatch[],
): boolean {
  const diagnosticMatches = new Array<number>(diagnostics.length).fill(-1);

  function assignExpectation(expectationIndex: number, visited: boolean[]): boolean {
    for (let diagnosticIndex = 0; diagnosticIndex < diagnostics.length; diagnosticIndex++) {
      if (
        visited[diagnosticIndex] ||
        !diagnosticMatchesExpectation(diagnostics[diagnosticIndex], expectations[expectationIndex])
      ) {
        continue;
      }

      visited[diagnosticIndex] = true;
      const previousExpectation = diagnosticMatches[diagnosticIndex];
      if (previousExpectation === -1 || assignExpectation(previousExpectation, visited)) {
        diagnosticMatches[diagnosticIndex] = expectationIndex;
        return true;
      }
    }
    return false;
  }

  return expectations.every((_, index) =>
    assignExpectation(index, new Array<boolean>(diagnostics.length).fill(false)),
  );
}

function diagnosticMatchesExpectation(
  diagnostic: Diagnostic,
  expectation: DiagnosticMatch,
): boolean {
  if (expectation.code !== undefined && diagnostic.code !== expectation.code) {
    return false;
  }
  if (
    expectation.message !== undefined &&
    !strOrRegexMatches(diagnostic.message, expectation.message)
  ) {
    return false;
  }
  if (expectation.severity !== undefined && diagnostic.severity !== expectation.severity) {
    return false;
  }
  if (
    expectation.file === undefined &&
    expectation.pos === undefined &&
    expectation.end === undefined
  ) {
    return true;
  }
  if (diagnostic.target === NoTarget) {
    return false;
  }

  const source = getSourceLocation(diagnostic.target);
  if (
    expectation.file !== undefined &&
    !strOrRegexMatches(
      source.file.path,
      typeof expectation.file === "string"
        ? resolveVirtualPath(expectation.file)
        : expectation.file,
    )
  ) {
    return false;
  }
  if (expectation.pos !== undefined && source.pos !== expectation.pos) {
    return false;
  }
  if (expectation.end !== undefined && source.end !== expectation.end) {
    return false;
  }
  return true;
}

function strOrRegexMatches(value: string, expectation: string | RegExp): boolean {
  if (typeof expectation === "string") {
    return value === expectation;
  }

  const lastIndex = expectation.lastIndex;
  const result = expectation.test(value);
  expectation.lastIndex = lastIndex;
  return result;
}

function matchStrOrRegex(value: string, expectation: string | RegExp, assertMessage: string) {
  if (typeof expectation === "string") {
    strictEqual(value, expectation, assertMessage);
  } else {
    match(value, expectation, assertMessage);
  }
}
