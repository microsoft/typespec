import { expect, it } from "vitest";
import { NoTarget, type Diagnostic } from "../../src/core/types.js";
import { expectDiagnostics } from "../../src/testing/expect.js";

function diagnostic(code: string, message: string): Diagnostic {
  return {
    code,
    message,
    severity: "error",
    target: NoTarget,
  };
}

it("requires diagnostics to use the expected order by default", () => {
  const diagnostics = [diagnostic("first", "First"), diagnostic("second", "Second")];

  expect(() => expectDiagnostics(diagnostics, [{ code: "second" }, { code: "first" }])).toThrow(
    "Diagnostic at index 0 has non matching code",
  );
});

it("can match diagnostics regardless of order", () => {
  const diagnostics = [diagnostic("first", "First"), diagnostic("second", "Second")];

  expectDiagnostics(diagnostics, [{ code: "second" }, { code: "first" }], {
    fixedOrder: false,
  });
});

it("matches overlapping expectations without depending on greedy order", () => {
  const diagnostics = [diagnostic("shared", "Specific"), diagnostic("shared", "Other")];

  expectDiagnostics(diagnostics, [{ code: "shared" }, { message: "Specific" }], {
    fixedOrder: false,
  });
});

it("allows unmatched diagnostics in non-strict unordered mode", () => {
  const diagnostics = [diagnostic("first", "First"), diagnostic("second", "Second")];

  expectDiagnostics(diagnostics, { code: "second" }, { strict: false, fixedOrder: false });
});

it("retains strict count validation in unordered mode", () => {
  const diagnostics = [diagnostic("first", "First"), diagnostic("second", "Second")];

  expect(() => expectDiagnostics(diagnostics, { code: "second" }, { fixedOrder: false })).toThrow(
    "Expected 1 diagnostics but found 2",
  );
});
