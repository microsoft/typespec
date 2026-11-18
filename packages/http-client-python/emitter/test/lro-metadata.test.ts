import { expectDiagnostics } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { emitCodeModel } from "./test-host.js";

it.each([true, false])(
  "emits selected LRO paths without changing unannotated operations (%s)",
  async (annotated) => {
    const { codeModel, diagnostics } = await emitCodeModel(`
    import "@azure-tools/typespec-azure-core";
    import "@azure-tools/typespec-client-generator-core";
    using TypeSpec.Http;
    using Azure.Core;
    using Azure.ClientGenerator.Core;

    @service namespace Test;
    model Usage { tokens: int32; }
    model BaseStatus {
      ${annotated ? "@lroStatusMetadata" : ""}
      @clientName("progress")
      @encodedName("application/json", "wire.progress")
      usage?: Usage;
    }
    model Monitor extends BaseStatus {
      ${annotated ? "@lroOperationId" : ""}
      @encodedName("application/json", "server-id")
      id: string;
      status: Foundations.OperationState;
      result?: string;
    }
    @get @route("/operations/{id}/status")
    op poll(${annotated ? "@lroOperationId" : ""} @path id: string): Monitor;
    @post @route("/jobs")
    @pollingOperation(poll)
    op start(): Foundations.AcceptedResponse<Monitor> &
      Foundations.LongRunningStatusLocation<Monitor>;
  `);
    expectDiagnostics(diagnostics, []);
    const client = codeModel.clients[0] as {
      operationGroups: { operations: { name: string; lroMetadata?: unknown }[] }[];
    };
    const start = client.operationGroups
      .flatMap((group) => group.operations)
      .find((op) => op.name === "start");
    expect(start).toBeDefined();
    if (!annotated) {
      expect(start).not.toHaveProperty("lroMetadata");
      return;
    }
    expect(start).toEqual(
      expect.objectContaining({
        name: "start",
        discriminator: "lro",
        lroMetadata: expect.objectContaining({
          responseModel: expect.objectContaining({ name: "Monitor" }),
          statusMetadata: [{ propertySegments: ["wire.progress"] }],
          operationIdPath: ["server-id"],
          operationIdUri: {
            location: "ResponseHeader",
            property: "Operation-Location",
            pattern: "/operations/(?P<operation_id>[^/]+)/status/?$",
          },
          initialResponseIsMonitor: true,
        }),
      }),
    );
  },
);

it.each(["{+id}", "{id*}"])(
  "diagnoses unsupported operation-ID URI templates (%s)",
  async (segment) => {
    const { diagnostics } = await emitCodeModel(`
    import "@azure-tools/typespec-azure-core";
    import "@azure-tools/typespec-client-generator-core";
    using TypeSpec.Http;
    using Azure.Core;
    using Azure.ClientGenerator.Core;

    @service namespace Test;
    model Monitor { status: Foundations.OperationState; result?: string; }
    @get @route("/operations/${segment}/status")
    op poll(@lroOperationId @path id: string): Monitor;
    @post @route("/jobs")
    @pollingOperation(poll)
    op start(): Foundations.AcceptedResponse<Monitor> &
      Foundations.LongRunningStatusLocation<Monitor>;
  `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/http-client-python/unsupported-lro-operation-id-template",
      severity: "warning",
    });
  },
);

it("emits a path pattern for URI templates with other parameters and query expansions", async () => {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@azure-tools/typespec-azure-core";
    import "@azure-tools/typespec-client-generator-core";
    using TypeSpec.Http;
    using Azure.Core;
    using Azure.ClientGenerator.Core;

    @service namespace Test;
    model Monitor { status: Foundations.OperationState; result?: string; }
    @get @route("/v1.0/{account}/operations/{id}/status")
    op poll(@path account: string, @lroOperationId @path id: string, @query apiVersion?: string): Monitor;
    @post @route("/v1.0/{account}/jobs")
    @pollingOperation(poll)
    op start(@path account: string): Foundations.AcceptedResponse<Monitor> &
      Foundations.LongRunningStatusLocation<Monitor>;
  `);
  expectDiagnostics(diagnostics, []);
  const client = codeModel.clients[0] as {
    operationGroups: {
      operations: { name: string; lroMetadata?: { operationIdUri?: unknown } }[];
    }[];
  };
  const start = client.operationGroups
    .flatMap((group) => group.operations)
    .find((op) => op.name === "start");
  expect(start?.lroMetadata?.operationIdUri).toEqual({
    location: "ResponseHeader",
    property: "Operation-Location",
    pattern: "/v1\\.0/[^/]+/operations/(?P<operation_id>[^/]+)/status/?$",
  });
});
