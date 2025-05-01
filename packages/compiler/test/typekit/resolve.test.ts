import { beforeEach, expect, it } from "vitest";
import { isValue } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { BasicTestRunner } from "../../src/testing/types.js";
import { $ } from "../../src/typekit/index.js";

let runner: BasicTestRunner;
beforeEach(async () => {
  runner = createTestWrapper(await createTestHost());
});

it("resolve resolves existing types", async () => {
  await runner.compile("");
  const tk = $(runner.program);
  const stringType = tk.resolve("TypeSpec.string");
  expect(stringType).toBeDefined();
  expect(tk.builtin.string).toBe(stringType);

  const [stringTypeDiag, diagnostics] = tk.resolve.withDiagnostics("TypeSpec.string");
  expect(stringTypeDiag).toBe(stringType);
  expect(diagnostics).toHaveLength(0);
});

it("resolve resolves existing values", async () => {
  await runner.compile(`const stringValue = "test";`);
  const tk = $(runner.program);
  const stringValue = tk.resolve("stringValue");
  expect(stringValue).toBeDefined();
  expect(isValue(stringValue!)).toBe(true);

  const [stringValueDiag, diagnostics] = tk.resolve.withDiagnostics("stringValue");
  expect(isValue(stringValueDiag!)).toBe(true);
  expect(diagnostics).toHaveLength(0);
});

it("resolve returns undefined and diagnostics for invalid references", async () => {
  await runner.compile("");
  const unknownType = $(runner.program).resolve("UnknownModel");
  expect(unknownType).toBeUndefined();

  const [unknownTypeDiag, diagnostics] = $(runner.program).resolve.withDiagnostics("UnknownModel");
  expect(unknownTypeDiag).toBeUndefined();
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0].code).toBe("invalid-ref");
});
