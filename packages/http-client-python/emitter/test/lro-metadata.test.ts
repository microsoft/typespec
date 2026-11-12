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
    if (!annotated) {
      expect(codeModel.clients[0]).toHaveProperty("operationGroups.0.operations.2.name", "start");
      expect(codeModel.clients[0]).not.toHaveProperty("operationGroups.0.operations.2.lroMetadata");
      return;
    }
    expect(codeModel.clients).toContainEqual(
      expect.objectContaining({
        operationGroups: expect.arrayContaining([
          expect.objectContaining({
            operations: expect.arrayContaining([
              expect.objectContaining({
                name: "start",
                discriminator: "lro",
                lroMetadata: expect.objectContaining({
                  statusMetadata: [
                    expect.objectContaining({
                      clientName: "progress",
                      propertySegments: ["wire.progress"],
                      type: expect.objectContaining({ name: "Usage" }),
                    }),
                  ],
                  operationIdPath: ["server-id"],
                  operationIdUri: {
                    location: "ResponseHeader",
                    property: "Operation-Location",
                    path: "/operations/{id}/status",
                    parameter: "id",
                  },
                  initialResponseIsMonitor: true,
                }),
              }),
            ]),
          }),
        ]),
      }),
    );
  },
);
