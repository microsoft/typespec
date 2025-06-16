import { expect, it } from "vitest";
import { NoTarget, type Diagnostic } from "../../src/core/types.js";
import { createDiagnosable } from "../../src/typekit/index.js";

it("createDiagnosable wraps a function to ignore diagnostics by default", () => {
  const mockDiagnostic: Diagnostic = {
    code: "test-diag",
    message: "Test diagnostic",
    severity: "warning",
    target: NoTarget, // Use NoTarget instead of a generic Symbol
  };

  const originalFn = (arg: string): [string, readonly Diagnostic[]] => {
    return [`Result: ${arg}`, [mockDiagnostic]];
  };

  const diagnosableFn = createDiagnosable(originalFn);

  // Calling directly should ignore diagnostics
  expect(diagnosableFn("test")).toBe("Result: test");

  // Calling withDiagnostics should return the original tuple
  const [result, diagnostics] = diagnosableFn.withDiagnostics("test");
  expect(result).toBe("Result: test");
  expect(diagnostics).toEqual([mockDiagnostic]);
});
