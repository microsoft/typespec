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
 * Options for {@link expectDiagnostics }.
 */
export interface ExpectDiagnosticsOptions {
  /**
   * When true (default), the number of diagnostics must match exactly.
   * When false, only the presence of expected diagnostics is checked.
   */
  strict?: boolean;
  /**
   * When true, diagnostics are sorted before comparison so that the order
   * of diagnostics in the array does not matter.
   */
  ignoreOrder?: boolean;
}

/**
 * Validate the diagnostic array contains exactly the given diagnostics.
 * @param diagnostics Array of the diagnostics
 * @param match Expected diagnostic matchers
 * @param options Comparison options
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
  options: ExpectDiagnosticsOptions = {},
) {
  const array = isArray(match) ? match : [match];

  // Sort both arrays if ignoreOrder is requested so order doesn't matter
  if (options.ignoreOrder) {
    const sortKey = (d: { code: string; message: string; severity: string }) =>
      d.code + "|" + d.severity + "|" + d.message;
    const keyed = (d: { code?: string; message?: string; severity?: string }) => ({
      code: d.code ?? "",
      message: d.message ?? "",
      severity: d.severity ?? "",
    });
    diagnostics = [...diagnostics].sort((a, b) =>
      sortKey(keyed(a)).localeCompare(sortKey(keyed(b))),
    );
    // Also sort the expected array so indices still align after sorting
    array = [...array].sort((a, b) =>
      sortKey(keyed(a)).localeCompare(sortKey(keyed(b))),
    );
  }

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
