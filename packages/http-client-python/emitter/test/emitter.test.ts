import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { EmitterTester, emitCodeModel } from "./test-host.js";

it("preserves numeric property names while fixing numeric enum members", async () => {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@typespec/http";
    using TypeSpec.Http;

    @service namespace Test;
    enum NumericNames {
      WEB_SEARCH_PREVIEW_2025_03_11: "web",
      DEFAULT_2024_11_15: "default",
      A2A: "a2a",
      int32: "int32",
      enumMemberV2Preview: "preview",
    }
    model NumericProperties {
      int32Property: int32;
      float32Property: float32;
      subscriptionResource1Name: string;
      names: NumericNames;
    }
    @get op read(): NumericProperties;
  `);

  expectDiagnostics(diagnostics, []);
  expect(codeModel.types).toContainEqual(
    expect.objectContaining({
      type: "enum",
      name: "NumericNames",
      values: expect.arrayContaining([
        expect.objectContaining({ name: "WEB_SEARCH_PREVIEW_2025_03_11" }),
        expect.objectContaining({ name: "DEFAULT_2024_11_15" }),
        expect.objectContaining({ name: "A2A" }),
        expect.objectContaining({ name: "INT32" }),
        expect.objectContaining({ name: "ENUM_MEMBER_V2_PREVIEW" }),
      ]),
    }),
  );
  expect(codeModel.types).toContainEqual(
    expect.objectContaining({
      type: "model",
      name: "NumericProperties",
      properties: expect.arrayContaining([
        expect.objectContaining({ clientName: "int32_property" }),
        expect.objectContaining({ clientName: "float32_property" }),
        expect.objectContaining({ clientName: "subscription_resource1_name" }),
      ]),
    }),
  );
});

it("preserves an XML response body with the legacy bytes encoding", async () => {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@typespec/http";
    using TypeSpec.Http;

    @service namespace Test;
    @get op publishingProfile(): {
      @header("Content-Type") contentType: "application/xml";
      @bodyRoot @encode("bytes") body: bytes;
    };
  `);

  expectDiagnostics(diagnostics, []);
  expect(codeModel.types).toContainEqual(
    expect.objectContaining({ type: "bytes", encode: "bytes" }),
  );
});

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
