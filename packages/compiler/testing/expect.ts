import assert, { match, strictEqual } from "assert";
import { Diagnostic, formatDiagnostic } from "../core/index.js";
import { isArray } from "../core/util.js";

/**
 * Assert there is no diagnostics.
 * @param diagnostics Diagnostics
 */
export function expectDiagnosticEmpty(diagnostics: readonly Diagnostic[]) {
  if (diagnostics.length > 0) {
    assert.fail(`Unexpected diagnostics:\n${formatDiagnostics(diagnostics)}`);
  }
}

function formatDiagnostics(diagnostics: readonly Diagnostic[]) {
  return diagnostics.map(formatDiagnostic).join("\n");
}
/**
 * Condition to match
 */
export interface DiagnosticMatch {
  /**
   * Match the code.
   */
  code: string;

  /**
   * Match the message.
   */
  message?: string | RegExp;

  /**
   * Match the severity.
   */
  severity?: "error" | "warning";
}

/**
 * Validate the diagnostic array contains exactly the given diagnostics.
 * @param diagnostics Array of the diagnostics
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[]
) {
  const array = isArray(match) ? match : [match];

  if (array.length !== diagnostics.length) {
    assert.fail(
      `Expected ${array.length} diagnostics but found ${diagnostics.length}:\n ${formatDiagnostics(
        diagnostics
      )}`
    );
  }
  for (let i = 0; i < array.length; i++) {
    const diagnostic = diagnostics[i];
    const expectation = array[i];
    const sep = "-".repeat(100);
    const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(diagnostics)}\n${sep}`;
    strictEqual(
      diagnostic.code,
      expectation.code,
      `Diagnostics at index ${i} has non matching code.\n${message}`
    );

    if (expectation.message !== undefined) {
      matchMessage(
        diagnostic.message,
        expectation.message,
        `Diagnostics at index ${i} has non matching message.\n${message}`
      );
    }
    if (expectation.severity !== undefined) {
      strictEqual(
        diagnostic.severity,
        expectation.severity,
        `Diagnostics at index ${i} has non matching severity.\n${message}`
      );
    }
  }
}

function matchMessage(message: string, expectation: string | RegExp, assertMessage: string) {
  if (typeof expectation === "string") {
    strictEqual(message, expectation, assertMessage);
  } else {
    match(message, expectation, assertMessage);
  }
}
