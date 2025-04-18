import { beforeEach, expect, it } from "vitest";
import { IntrinsicType } from "../../../../src/core/types.js"; // Corrected path
import { $ } from "../../../../src/experimental/typekit/index.js"; // Corrected path
import "../../../../src/experimental/typekit/kits/resolve.js"; // Corrected path
import { createTestHost } from "../../../../src/testing/test-host.js";
import { createTestWrapper } from "../../../../src/testing/test-utils.js";
import { BasicTestRunner } from "../../../../src/testing/types.js";

let runner: BasicTestRunner;
beforeEach(async () => {
  runner = createTestWrapper(await createTestHost());
});

it("resolveTypeReference resolves existing types", async () => {
  await runner.compile("");
  const tk = $(runner.program);
  const stringType = tk.resolve.typeReference("TypeSpec.string");
  expect(stringType).toBeDefined();
  expect(stringType?.kind).toBe("Scalar");
  expect((stringType as IntrinsicType).name).toBe("string");

  const [stringTypeDiag, diagnostics] = tk.resolve.typeReference.withDiagnostics("TypeSpec.string");
  expect(stringTypeDiag).toBe(stringType);
  expect(diagnostics).toHaveLength(0);
});

it("resolveTypeReference returns undefined and diagnostics for invalid references", async () => {
  await runner.compile("");
  const unknownType = $(runner.program).resolve.typeReference("UnknownModel");
  expect(unknownType).toBeUndefined();

  const [unknownTypeDiag, diagnostics] = $(runner.program).resolve.typeReference.withDiagnostics(
    "UnknownModel",
  );
  expect(unknownTypeDiag).toBeUndefined();
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0].code).toBe("invalid-ref");
});
