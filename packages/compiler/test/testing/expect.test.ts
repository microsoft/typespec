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

it("matches stateful regular expressions consistently", () => {
  const diagnostics = [diagnostic("first", "Shared one"), diagnostic("second", "Shared two")];
  const message = /shared/gi;

  expectDiagnostics(diagnostics, [{ message }, { message }], { fixedOrder: false });
  expect(message.lastIndex).toBe(0);
  expectDiagnostics(diagnostics, [{ message }, { message }], { fixedOrder: false });
});

it("includes unmatched expectations in unordered failure messages", () => {
  const diagnostics = [diagnostic("actual", "Actual diagnostic")];

  expect(() =>
    expectDiagnostics(
      diagnostics,
      { code: "expected", message: /missing/i },
      { fixedOrder: false },
    ),
  ).toThrow(
    'Expected diagnostics:\n0: {"code":"expected","message":"/missing/i"}\nDiagnostics found:',
  );
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

it("does not reuse one diagnostic for multiple unordered expectations", () => {
  const diagnostics = [diagnostic("shared", "Specific"), diagnostic("shared", "Other")];

  expect(() =>
    expectDiagnostics(diagnostics, [{ message: "Specific" }, { message: "Specific" }], {
      fixedOrder: false,
    }),
  ).toThrow("Could not match the expected diagnostics regardless of order");
});

it("can reassign a chain of overlapping unordered expectations", () => {
  const diagnostics = [
    diagnostic("shared", "One"),
    diagnostic("shared", "Two"),
    diagnostic("shared", "Three"),
  ];

  expectDiagnostics(diagnostics, [{ code: "shared" }, { message: /One|Two/ }, { message: "One" }], {
    fixedOrder: false,
  });
});

it("rejects source expectations for diagnostics without a target in unordered mode", () => {
  expect(() =>
    expectDiagnostics([diagnostic("actual", "Actual")], { pos: 0 }, { fixedOrder: false }),
  ).toThrow("Could not match the expected diagnostics regardless of order");
});

it("rejects too few diagnostics even in non-strict unordered mode", () => {
  expect(() =>
    expectDiagnostics([diagnostic("actual", "Actual")], [{}, {}], {
      strict: false,
      fixedOrder: false,
    }),
  ).toThrow("Expected 2 diagnostics but found 1");
});

it("preserves prefix matching in non-strict ordered mode", () => {
  const diagnostics = [diagnostic("first", "First"), diagnostic("second", "Second")];

  expectDiagnostics(diagnostics, { code: "first" }, { strict: false });
  expect(() => expectDiagnostics(diagnostics, { code: "second" }, { strict: false })).toThrow(
    "Diagnostic at index 0 has non matching code",
  );
});

it("handles empty unordered expectations according to strictness", () => {
  expectDiagnostics([], [], { fixedOrder: false });
  expectDiagnostics([diagnostic("extra", "Extra")], [], { strict: false, fixedOrder: false });
  expect(() =>
    expectDiagnostics([diagnostic("extra", "Extra")], [], { fixedOrder: false }),
  ).toThrow("Expected 0 diagnostics but found 1");
});
