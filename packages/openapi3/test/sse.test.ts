import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";

// Create a custom tester that includes SSE, Events, and Streams libraries
const SSETester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: [
    "@typespec/http",
    "@typespec/json-schema",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/streams",
    "@typespec/events",
    "@typespec/sse",
    "@typespec/openapi3",
  ],
})
  .import(
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/streams",
    "@typespec/events",
    "@typespec/sse",
    "@typespec/openapi3",
  )
  .using("Http", "Rest", "OpenAPI", "TypeSpec.Streams", "TypeSpec.Events", "SSE")
  .emit("@typespec/openapi3", { "openapi-versions": ["3.2.0"] });

async function openApiFor(code: string, openAPIVersion = "3.2.0") {
  const host = await SSETester.createInstance();
  const outPath = "{emitter-output-dir}/openapi.json";
  const { outputs } = await host.compile(code, {
    compilerOptions: {
      options: {
        "@typespec/openapi3": { "output-file": outPath, "openapi-versions": [openAPIVersion] },
      },
    },
  });

  return JSON.parse(outputs["openapi.json"]);
}

async function openApiWithDiagnosticsFor(code: string, openAPIVersion = "3.2.0") {
  const host = await SSETester.createInstance();
  const outPath = "{emitter-output-dir}/openapi.json";
  const [result, diagnostics] = await host.compileAndDiagnose(code, {
    compilerOptions: {
      options: {
        "@typespec/openapi3": { "output-file": outPath, "openapi-versions": [openAPIVersion] },
      },
    },
  });

  return { openApi: JSON.parse(result.outputs["openapi.json"]), diagnostics };
}

describe("openapi3: SSE (Server-Sent Events)", () => {
  describe("Basic SSE stream without terminal event", () => {
    it("emits itemSchema for SSEStream with @events union", async () => {
      const openApi = await openApiFor(
        `
        model UserConnect {
          username: string;
        }

        model UserMessage {
          text: string;
        }

        @events
        union ChannelEvents {
          userconnect: UserConnect,
          usermessage: UserMessage,
        }

        @service
        @route("/channel")
        namespace Channel {
          @get op subscribe(): SSEStream<ChannelEvents>;
        }
        `,
      );

      ok(openApi.paths["/channel"], "expected /channel path");
      const response = openApi.paths["/channel"].get.responses["200"];
      ok(response, "expected 200 response");
      ok(response.content, "expected content");

      ok(response.content["text/event-stream"], "expected text/event-stream content type");

      const eventStreamContent = response.content["text/event-stream"];
      ok(eventStreamContent.itemSchema, "expected itemSchema for SSE");

      // Check the base structure
      deepStrictEqual(eventStreamContent.itemSchema.type, "object");
      deepStrictEqual(eventStreamContent.itemSchema.required, ["event"]);
      ok(eventStreamContent.itemSchema.properties, "expected properties");
      deepStrictEqual(eventStreamContent.itemSchema.properties.event.type, "string");
      deepStrictEqual(eventStreamContent.itemSchema.properties.data.type, "string");

      // Check oneOf for event variants
      ok(eventStreamContent.itemSchema.oneOf, "expected oneOf");
      deepStrictEqual(eventStreamContent.itemSchema.oneOf.length, 2);

      // Check userconnect event
      const userConnectVariant = eventStreamContent.itemSchema.oneOf.find(
        (v: any) => v.properties?.event?.const === "userconnect",
      );
      ok(userConnectVariant, "expected userconnect variant");
      deepStrictEqual(userConnectVariant.properties.event.const, "userconnect");
      deepStrictEqual(userConnectVariant.properties.data.contentMediaType, "application/json");
      ok(
        userConnectVariant.properties.data.contentSchema,
        "expected contentSchema for userconnect",
      );

      // Check usermessage event
      const userMessageVariant = eventStreamContent.itemSchema.oneOf.find(
        (v: any) => v.properties?.event?.const === "usermessage",
      );
      ok(userMessageVariant, "expected usermessage variant");
      deepStrictEqual(userMessageVariant.properties.event.const, "usermessage");
      deepStrictEqual(userMessageVariant.properties.data.contentMediaType, "application/json");
      ok(
        userMessageVariant.properties.data.contentSchema,
        "expected contentSchema for usermessage",
      );
    });
  });

  describe("SSE stream with terminal event", () => {
    it("emits itemSchema with terminal event not marked by extension", async () => {
      const openApi = await openApiFor(
        `
        model UserConnect {
          username: string;
        }

        model UserMessage {
          text: string;
        }

        @events
        union ChannelEvents {
          userconnect: UserConnect,
          usermessage: UserMessage,
          @contentType("text/plain")
          @terminalEvent
          "[done]",
        }

        @service
        @route("/channel")
        namespace Channel {
          @get op subscribe(): SSEStream<ChannelEvents>;
        }
        `,
      );

      ok(openApi.paths["/channel"], "expected /channel path");
      const response = openApi.paths["/channel"].get.responses["200"];
      const eventStreamContent = response.content["text/event-stream"];
      ok(eventStreamContent.itemSchema, "expected itemSchema for SSE");

      // Check oneOf includes all three events
      ok(eventStreamContent.itemSchema.oneOf, "expected oneOf");
      deepStrictEqual(eventStreamContent.itemSchema.oneOf.length, 3);

      // Check terminal event
      const terminalVariant = eventStreamContent.itemSchema.oneOf[2];
      ok(terminalVariant, "expected terminal event variant");
      deepStrictEqual(terminalVariant.properties.data.const, "[done]");
      deepStrictEqual(terminalVariant.properties.data.contentMediaType, "text/plain");
      deepStrictEqual(terminalVariant["x-ms-sse-terminal-event"], undefined);
    });

    it("emits itemSchema with terminal event marked by extension", async () => {
      const openApi = await openApiFor(
        `
        model UserConnect {
          username: string;
        }

        model UserMessage {
          text: string;
        }

        @events
        union ChannelEvents {
          userconnect: UserConnect,
          usermessage: UserMessage,
          @contentType("text/plain")
          @terminalEvent
          @extension("x-ms-sse-terminal-event", true)
          "[done]",
        }

        @service
        @route("/channel")
        namespace Channel {
          @get op subscribe(): SSEStream<ChannelEvents>;
        }
        `,
      );

      ok(openApi.paths["/channel"], "expected /channel path");
      const response = openApi.paths["/channel"].get.responses["200"];
      const eventStreamContent = response.content["text/event-stream"];
      ok(eventStreamContent.itemSchema, "expected itemSchema for SSE");

      // Check oneOf includes all three events
      ok(eventStreamContent.itemSchema.oneOf, "expected oneOf");
      deepStrictEqual(eventStreamContent.itemSchema.oneOf.length, 3);

      // Check terminal event
      const terminalVariant = eventStreamContent.itemSchema.oneOf[2];
      ok(terminalVariant, "expected terminal event variant");
      deepStrictEqual(terminalVariant.properties.data.const, "[done]");
      deepStrictEqual(terminalVariant.properties.data.contentMediaType, "text/plain");
      deepStrictEqual(terminalVariant["x-ms-sse-terminal-event"], true);
    });
  });

  describe("SSE stream with custom content types", () => {
    it("respects @contentType decorator on event payload", async () => {
      const openApi = await openApiFor(
        `
        model BinaryData {
          data: bytes;
        }

        @events
        union DataEvents {
          @contentType("application/octet-stream")
          binary: BinaryData,
        }

        @service
        @route("/data")
        namespace Data {
          @get op subscribe(): SSEStream<DataEvents>;
        }
        `,
      );

      const response = openApi.paths["/data"].get.responses["200"];
      const eventStreamContent = response.content["text/event-stream"];
      ok(eventStreamContent.itemSchema, "expected itemSchema for SSE");

      // Check the binary event has custom content type
      const binaryVariant = eventStreamContent.itemSchema.oneOf[0];
      deepStrictEqual(binaryVariant.properties.data.contentMediaType, "application/octet-stream");
    });
  });

  const versionsWithNoItemSchema = ["3.0.0", "3.1.0"];

  versionsWithNoItemSchema.forEach((version) => {
    describe(`OpenAPI ${version} SSE handling`, () => {
      it(`emits text/event-stream response without itemSchema and logs warning for OpenAPI ${version}`, async () => {
        const { openApi, diagnostics } = await openApiWithDiagnosticsFor(
          `
          model UserConnect {
            username: string;
          }

          model UserMessage {
            text: string;
          }

          @events
          union ChannelEvents {
            userconnect: UserConnect,
            usermessage: UserMessage,
          }

          @service
          @route("/channel")
          namespace Channel {
            @get op subscribe(): SSEStream<ChannelEvents>;
          }
          `,
          "3.1.0",
        );

        // Verify the warning is emitted
        expectDiagnostics(diagnostics, [
          {
            code: "@typespec/openapi3/sse-not-supported",
            severity: "warning",
          },
        ]);

        // Verify the response structure
        ok(openApi.paths["/channel"], "expected /channel path");
        const response = (openApi.paths["/channel"] as any).get.responses["200"];
        ok(response, "expected 200 response");
        ok(response.content, "expected content");

        ok(response.content["text/event-stream"], "expected text/event-stream content type");

        const eventStreamContent = response.content["text/event-stream"];

        // For OpenAPI 3.1.0, itemSchema should NOT be present
        ok(!eventStreamContent.itemSchema, "itemSchema should not be present for OpenAPI 3.1.0");

        // Should have basic schema for string type
        ok(eventStreamContent.schema, "expected basic schema");
        deepStrictEqual(eventStreamContent.schema.type, "string");
      });
    });
  });
});
