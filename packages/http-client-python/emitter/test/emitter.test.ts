import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { emitCodeModel } from "./test-host.js";

it("targets the service namespace when no SDK clients are found", async () => {
  const { diagnostics } = await emitCodeModel(t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `);

  expectDiagnostics(diagnostics, []);
});

it("generates models when no service exists", async () => {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@azure-tools/typespec-client-generator-core";
    using Azure.ClientGenerator.Core;

    #suppress "@typespec/http-client-python/no-sdk-clients" "This model-only package intentionally has no client."
    @access(Access.public)
    @usage(Usage.input | Usage.output)
    @clientNamespace("Models")
    model Widget {}
  `);

  expectDiagnostics(diagnostics, []);
  // A model-only package has no clients but must still emit its models into the code model.
  expect(codeModel.clients).toHaveLength(0);
  expect(
    codeModel.types.some(
      (type) => type.type === "model" && type.name === "Widget",
    ),
  ).toBe(true);
});
