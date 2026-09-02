import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { expect } from "vitest";
import { EmitterTester } from "./test-host.js";

it("targets the service namespace when no SDK clients are found", async () => {
  const [, diagnostics] = await EmitterTester.compileAndDiagnose(t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `);

  expectDiagnostics(diagnostics, []);
});

it("generates models when no service exists", async () => {
  const [result, diagnostics] = await EmitterTester.compileAndDiagnose(`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This model-only package intentionally has no client."
    namespace Models {
      model Widget {}
    }
  `);

  expectDiagnostics(diagnostics, []);
  expect(
    Object.entries(result.outputs).some(
      ([path, content]) => path.endsWith("models/_models.py") && content.includes("class Widget"),
    ),
  ).toBe(true);
});
