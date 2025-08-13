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
 * Options for diagnostic validation
 */
export interface ExpectDiagnosticsOptions {
  /**
   * Whether to require exact number of diagnostics
   */
  strict?: boolean;
  
  /**
   * Whether to match diagnostics in fixed order
   */
  fixedOrder?: boolean;
}

/**
 * Validate the diagnostic array contains exactly the given diagnostics.
 * @param diagnostics Array of the diagnostics
 * @param match Diagnostic match conditions
 * @param options Validation options
 */
export function expectDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
  options: ExpectDiagnosticsOptions = {
    strict: true,
    fixedOrder: true,
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

  if (options.fixedOrder !== false) {
    // Original behavior: match in order
    validateDiagnosticsInOrder(diagnostics, array);
  } else {
    // New behavior: match without order
    validateDiagnosticsAnyOrder(diagnostics, array);
  }
}

/**
 * Validate diagnostics in the exact order specified
 */
function validateDiagnosticsInOrder(
  diagnostics: readonly Diagnostic[],
  expectations: DiagnosticMatch[]
) {
  for (let i = 0; i < expectations.length; i++) {
    const diagnostic = diagnostics[i];
    const expectation = expectations[i];
    const sep = "-".repeat(100);
    const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(diagnostics)}\n${sep}`;
    
    validateSingleDiagnostic(diagnostic, expectation, i, message);
  }
}

/**
 * Validate diagnostics in any order
 */
function validateDiagnosticsAnyOrder(
  diagnostics: readonly Diagnostic[],
  expectations: DiagnosticMatch[]
) {
  const unusedDiagnostics = [...diagnostics];
  const unmatchedExpectations: DiagnosticMatch[] = [];

  for (const expectation of expectations) {
    let found = false;
    
    for (let i = 0; i < unusedDiagnostics.length; i++) {
      const diagnostic = unusedDiagnostics[i];
      
      if (diagnosticMatches(diagnostic, expectation)) {
        unusedDiagnostics.splice(i, 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      unmatchedExpectations.push(expectation);
    }
  }

  if (unmatchedExpectations.length > 0) {
    const sep = "-".repeat(100);
    const message = `Diagnostics found:\n${sep}\n${formatDiagnostics(diagnostics)}\n${sep}`;
    const unmatchedStr = unmatchedExpectations
      .map((exp, i) => `  ${i + 1}. ${JSON.stringify(exp)}`)
      .join('\n');
    
    fail(`Could not find matching diagnostics for:\n${unmatchedStr}\n${message}`);
  }
}

/**
 * Check if a diagnostic matches the given expectation
 */
function diagnosticMatches(diagnostic: Diagnostic, expectation: DiagnosticMatch): boolean {
  // Check code
  if (expectation.code !== undefined && diagnostic.code !== expectation.code) {
    return false;
  }

  // Check message
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

  // Check severity
  if (expectation.severity !== undefined && diagnostic.severity !== expectation.severity) {
    return false;
  }

  // Check file, pos, and end
  if (
    expectation.file !== undefined ||
    expectation.pos !== undefined ||
    expectation.end !== undefined
  ) {
    if (diagnostic.target === NoTarget) {
      return false;
    }
    
    const source = getSourceLocation(diagnostic.target);

    if (expectation.file !== undefined) {
      const expectedFile = typeof expectation.file === "string"
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
}

/**
 * Validate a single diagnostic against an expectation
 */
function validateSingleDiagnostic(
  diagnostic: Diagnostic,
  expectation: DiagnosticMatch,
  index: number,
  message: string
) {
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

function matchStrOrRegex(value: string, expectation: string | RegExp, assertMessage: string) {
  if (typeof expectation === "string") {
    strictEqual(value, expectation, assertMessage);
  } else {
    match(value, expectation, assertMessage);
  }
}
