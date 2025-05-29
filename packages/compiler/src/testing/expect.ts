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

/**
 * Validate the diagnostic array contains exactly the given diagnostics.
 * @param diagnostics Array of the diagnostics
 * @param match The diagnostic match(es) to validate against
 * @param options Options for validation
 * @param options.strict When true, expects exactly the same number of diagnostics as matches
 * @param options.fixedOrder When true, diagnostics must appear in the same order as matches. When false, order is ignored.
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
  options: {
    strict?: boolean;
    fixedOrder?: boolean;
  } = {},
) {
  // Set defaults
  const { strict = true, fixedOrder = true } = options;

  const array = isArray(match) ? match : [match];

  if (strict && array.length !== diagnostics.length) {
    fail(
      `Expected ${array.length} diagnostics but found ${diagnostics.length}:\n ${formatDiagnostics(
        diagnostics,
      )}`,
    );
  }

  if (fixedOrder) {
    // Original behavior: match diagnostics in order
    for (let i = 0; i < array.length; i++) {
      const diagnostic = diagnostics[i];
      const expectation = array[i];
      validateDiagnosticMatch(diagnostic, expectation, i, diagnostics);
    }
  } else {
    // New behavior: match diagnostics in any order
    const remainingDiagnostics = [...diagnostics];
    const unmatchedExpectations: number[] = [];

    for (let i = 0; i < array.length; i++) {
      const expectation = array[i];
      let matchFound = false;

      for (let j = remainingDiagnostics.length - 1; j >= 0; j--) {
        const diagnostic = remainingDiagnostics[j];
        if (doesDiagnosticMatch(diagnostic, expectation)) {
          remainingDiagnostics.splice(j, 1);
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        unmatchedExpectations.push(i);
      }
    }

    if (unmatchedExpectations.length > 0) {
      const sep = "-".repeat(100);
      const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(diagnostics)}\n${sep}`;
      fail(
        `Could not find matches for expectations at indices: ${unmatchedExpectations.join(", ")}.\n${message}`,
      );
    }

    // When strict mode is enabled but fixedOrder is false, check for extra diagnostics
    if (strict && remainingDiagnostics.length > 0) {
      const sep = "-".repeat(100);
      const message = `Extra unmatched diagnostics found:\n${sep}\n${formatDiagnostics(remainingDiagnostics)}\n${sep}`;
      fail(message);
    }
  }
}

/**
 * Validates that a diagnostic matches the expected criteria
 */
function validateDiagnosticMatch(
  diagnostic: Diagnostic,
  expectation: DiagnosticMatch,
  index: number,
  allDiagnostics: readonly Diagnostic[],
) {
  const sep = "-".repeat(100);
  const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(allDiagnostics)}\n${sep}`;

  if (expectation.code !== undefined) {
    strictEqual(
      diagnostic.code,
      expectation.code,
      `Diagnostic at index ${index} has non matching code.\n${message}`,
    );
  }

  if (expectation.message !== undefined) {
    matchStrOrRegex(
      diagnostic.message,
      expectation.message,
      `Diagnostic at index ${index} has non matching message.\n${message}`,
    );
  }
  if (expectation.severity !== undefined) {
    strictEqual(
      diagnostic.severity,
      expectation.severity,
      `Diagnostic at index ${index} has non matching severity.\n${message}`,
    );
  }
  if (
    expectation.file !== undefined ||
    expectation.pos !== undefined ||
    expectation.end !== undefined
  ) {
    if (diagnostic.target === NoTarget) {
      fail(`Diagnostics at index ${index} expected to have a target.\n${message}`);
    }
    const source = getSourceLocation(diagnostic.target);

    if (!source) {
      fail(`Diagnostics at index ${index} expected to have a valid source location.\n${message}`);
      return; // This will never be reached, but helps TypeScript understand control flow
    }

    if (expectation.file !== undefined) {
      matchStrOrRegex(
        source.file.path,
        typeof expectation.file === "string"
          ? resolveVirtualPath(expectation.file)
          : expectation.file,
        `Diagnostics at index ${index} has non matching file.\n${message}`,
      );
    }

    if (expectation.pos !== undefined) {
      strictEqual(
        source.pos,
        expectation.pos,
        `Diagnostic at index ${index} has non-matching start position.`,
      );
    }

    if (expectation.end !== undefined) {
      strictEqual(
        source.end,
        expectation.end,
        `Diagnostic at index ${index} has non-matching end position.`,
      );
    }
  }
}

/**
 * Checks if a diagnostic matches the expected criteria without throwing errors
 */
function doesDiagnosticMatch(diagnostic: Diagnostic, expectation: DiagnosticMatch): boolean {
  try {
    if (expectation.code !== undefined && diagnostic.code !== expectation.code) {
      return false;
    }

    if (expectation.message !== undefined) {
      if (typeof expectation.message === "string") {
        if (diagnostic.message !== expectation.message) {
          return false;
        }
      } else {
        if (!expectation.message.test(diagnostic.message)) {
          return false;
        }
      }
    }

    if (expectation.severity !== undefined && diagnostic.severity !== expectation.severity) {
      return false;
    }

    if (
      expectation.file !== undefined ||
      expectation.pos !== undefined ||
      expectation.end !== undefined
    ) {
      if (diagnostic.target === NoTarget) {
        return false;
      }
      const source = getSourceLocation(diagnostic.target);

      if (!source) {
        return false;
      }

      if (expectation.file !== undefined) {
        const expectedFile =
          typeof expectation.file === "string"
            ? resolveVirtualPath(expectation.file)
            : expectation.file;

        if (typeof expectedFile === "string") {
          if (source.file.path !== expectedFile) {
            return false;
          }
        } else {
          if (!expectedFile.test(source.file.path)) {
            return false;
          }
        }
      }

      if (expectation.pos !== undefined && source.pos !== expectation.pos) {
        return false;
      }

      if (expectation.end !== undefined && source.end !== expectation.end) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function matchStrOrRegex(value: string, expectation: string | RegExp, assertMessage: string) {
  if (typeof expectation === "string") {
    strictEqual(value, expectation, assertMessage);
  } else {
    match(value, expectation, assertMessage);
  }
}
