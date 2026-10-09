import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { EmitterTester, emitCodeModel } from "./test-host.js";

it.each([undefined, false, true])(
  "propagates enable-sse-reconnect=%s to the Python generator",
  async (enabled) => {
    const { commandArgs, diagnostics } = await emitCodeModel(
      "@service namespace Test; op read(): string;",
      enabled === undefined ? {} : { "enable-sse-reconnect": enabled },
    );

    expectDiagnostics(diagnostics, []);
    expect(commandArgs["enable-sse-reconnect"]).toBe(enabled ?? false);
  },
);

it.each(["yes", "no", 2, {}, []])("rejects invalid enable-sse-reconnect=%s", async (value) => {
  const [, diagnostics] = await EmitterTester.compileAndDiagnose(
    "@service namespace Test; op read(): string;",
    {
      compilerOptions: {
        options: {
          "@typespec/http-client-python": {
            "emit-yaml-only": true,
            "enable-sse-reconnect": value,
          },
        },
      },
    },
  );

  expectDiagnostics(diagnostics, {
    code: "invalid-schema",
    message: /enable-sse-reconnect/,
  });
});

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
  expect(codeModel.types.some((type) => type.type === "model" && type.name === "Widget")).toBe(
    true,
  );
});
