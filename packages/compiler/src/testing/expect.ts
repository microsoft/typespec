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
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
  options = {
    strict: true,
  },
) {
  const array = isArray(match) ? match : [match];

  if (options.strict && array.length !== diagnostics.length) {
    fail(
      `Expected ${array.length} diagnostics but found ${diagnostics.length}:\n ${formatDiagnostics(
        diagnostics,
      )}`,
    );
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

function matchStrOrRegex(value: string, expectation: string | RegExp, assertMessage: string) {
  if (typeof expectation === "string") {
    strictEqual(value, expectation, assertMessage);
  } else {
    match(value, expectation, assertMessage);
  }
}
