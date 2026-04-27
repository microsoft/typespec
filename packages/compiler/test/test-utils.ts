import { ok } from "assert";
import type { Diagnostic } from "../src/index.js";
import { expectDiagnosticEmpty } from "../src/testing/expect.js";

export interface Test<I extends unknown[], R> {
  compile(...args: I): Promise<R>;
  compileAndDiagnose(...args: I): Promise<[R | undefined, readonly Diagnostic[]]>;
  diagnose(...args: I): Promise<readonly Diagnostic[]>;
}
export function defineTest<T extends unknown[], R>(
  fn: (...args: T) => Promise<[R | undefined, readonly Diagnostic[]]>,
): Test<T, R> {
  return {
    compileAndDiagnose: fn,
    compile: async (...args) => {
      const [called, diagnostics] = await fn(...args);
      expectDiagnosticEmpty(diagnostics);
      ok(called, "Decorator was not called");

      return called;
    },
    diagnose: async (...args) => {
      const [_, diagnostics] = await fn(...args);
      return diagnostics;
    },
  };
}

/**
 * Tagged template literal that removes common indentation from a multiline string.
 * Removes the leading newline and the common indentation from all lines,
 * allowing test expectations to be written at a readable indent level.
 *
 * @example
 * ```ts
 * const expected = d`
 *   line one
 *     indented
 *   line three
 * `;
 * // Produces:
 * // "line one\n  indented\nline three"
 * ```
 */
export function d(strings: TemplateStringsArray, ...values: unknown[]): string {
  const result = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

  return dedent(result);
}

/**
 * Remove common leading indentation from a multiline string.
 * Strips the first and last empty lines, then removes the indentation
 * level of the first non-empty line from all lines.
 */
export function dedent(str: string): string {
  // Remove leading and trailing line breaks
  str = str.replace(/^\n|\n[ ]*$/g, "");

  // Find the indent of the first line
  const match = str.match(/^[ \t]+/);
  const indent = match ? match[0] : "";

  // Remove the indent from each line
  return str
    .split("\n")
    .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
    .join("\n");
}
