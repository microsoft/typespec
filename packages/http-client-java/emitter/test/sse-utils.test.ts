import { describe, expect, it } from "vitest";
import { SchemaType, createObjectSchema, createStringSchema } from "../src/common/schemas/model.js";
import { SchemaContext } from "../src/common/schemas/usage.js";
import { createSseSchemas } from "../src/sse-utils.js";

describe("SSE schema construction", () => {
  it("creates registered-model-ready immutable envelopes around the supplied payload schemas", () => {
    const payload = createObjectSchema("Payload", "The wire payload.");
    const originalPayload = structuredClone(payload);
    const schemas = createSseSchemas({
      streamName: "RetrievalStreamEvents",
      sourceNamespace: "Search.Retrieval",
      javaNamespace: "com.azure.search.retrieval",
      events: [
        { name: "retrieval.started", payload, terminal: false },
        { name: "response.completed", payload: createStringSchema("string", ""), terminal: true },
      ],
    });

    expect(schemas.baseSchema).toMatchObject({
      type: SchemaType.Object,
      language: {
        default: { name: "RetrievalStreamEvent", namespace: "Search.Retrieval" },
        java: { namespace: "com.azure.search.retrieval" },
      },
      properties: [
        {
          serializedName: "eventName",
          required: true,
          nullable: false,
          readOnly: true,
          schema: { type: SchemaType.String },
        },
      ],
      usage: [SchemaContext.Sse],
      sseMetadata: { streamName: "RetrievalStreamEvents" },
    });
    expect([...schemas.eventSchemas.keys()]).toEqual(["retrieval.started", "response.completed"]);
    const started = schemas.eventSchemas.get("retrieval.started")!;
    expect(started.language).toMatchObject({
      default: { name: "RetrievalStartedStreamEvent", namespace: "Search.Retrieval" },
      java: { namespace: "com.azure.search.retrieval" },
    });
    expect(started).toMatchObject({
      sseMetadata: {
        streamName: "RetrievalStreamEvents",
        eventName: "retrieval.started",
        terminal: false,
      },
    });
    expect(started.parents?.immediate?.[0]).toBe(schemas.baseSchema);
    expect(started.parents?.all?.[0]).toBe(schemas.baseSchema);
    expect(schemas.baseSchema.children?.immediate).toEqual([
      schemas.eventSchemas.get("retrieval.started"),
      schemas.eventSchemas.get("response.completed"),
    ]);
    expect(schemas.baseSchema.children?.all).toEqual(schemas.baseSchema.children?.immediate);
    expect(started.usage).toEqual([SchemaContext.Sse]);
    expect(started.properties).toHaveLength(1);
    expect(started.properties?.[0]).toMatchObject({
      serializedName: "value",
      required: true,
      nullable: false,
      readOnly: true,
    });
    expect(started.properties?.[0].schema).toBe(payload);
    expect(payload).toEqual(originalPayload);
    expect(schemas.eventSchemas.get("response.completed")!.language.default.name).toBe(
      "RetrievalResponseCompletedStreamEvent",
    );
    expect(schemas.eventSchemas.get("response.completed")).toMatchObject({
      sseMetadata: {
        streamName: "RetrievalStreamEvents",
        eventName: "response.completed",
        terminal: true,
      },
    });
  });

  it("keeps raw digit patterns and leaves Java names unset", () => {
    const schemas = createSseSchemas({
      streamName: "StreamEvents",
      sourceNamespace: "SseNaming",
      javaNamespace: "com.azure.sse",
      events: [{ name: "123.done", payload: createStringSchema("string", ""), terminal: false }],
    });

    expect(schemas.baseSchema.language).toMatchObject({
      default: { name: "StreamEvent", namespace: "SseNaming" },
      java: { namespace: "com.azure.sse" },
    });
    expect(schemas.eventSchemas.get("123.done")!.language).toMatchObject({
      default: { name: "123DoneStreamEvent", namespace: "SseNaming" },
      java: { namespace: "com.azure.sse" },
    });
  });

  it("reports exact pattern conflicts as duplicate schema names", () => {
    expect(() =>
      createSseSchemas({
        streamName: "123StreamEvents",
        sourceNamespace: "SseNaming",
        javaNamespace: "com.azure.sse",
        events: [{ name: "123", payload: createStringSchema("string", ""), terminal: false }],
      }),
    ).toThrow("resolves to duplicate schema name '123StreamEvent'");
  });
});
