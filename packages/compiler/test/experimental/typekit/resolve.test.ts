import { beforeEach, expect, it } from "vitest";
import { IntrinsicType } from "../../../src/core/types.js";
import { $ } from "../../../src/experimental/typekit/index.js";
import { createTestHost } from "../../../src/testing/test-host.js";
import { createTestWrapper } from "../../../src/testing/test-utils.js";
import { BasicTestRunner } from "../../../src/testing/types.js";

let runner: BasicTestRunner;
beforeEach(async () => {
  runner = createTestWrapper(await createTestHost());
});

it("resolve resolves existing types", async () => {
  await runner.compile("");
  const tk = $(runner.program);
  const stringType = tk.resolve("TypeSpec.string");
  expect(stringType).toBeDefined();
  expect(stringType?.kind).toBe("Scalar");
  expect((stringType as IntrinsicType).name).toBe("string");

  const [stringTypeDiag, diagnostics] = tk.resolve.withDiagnostics("TypeSpec.string");
  expect(stringTypeDiag).toBe(stringType);
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
