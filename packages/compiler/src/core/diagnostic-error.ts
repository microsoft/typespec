import type { Diagnostic } from "./types.js";

/** Error that reuse the diagnostic system. */
export class DiagnosticError extends Error {
  readonly diagnostics: readonly Diagnostic[];

  constructor(diagnostics: Diagnostic | readonly Diagnostic[]) {
    super();
    this.diagnostics = Array.isArray(diagnostics) ? diagnostics : [diagnostics];
  }
}
