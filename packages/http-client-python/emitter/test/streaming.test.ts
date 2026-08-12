import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import {
  emitStructuredStreamingInfo,
  getStructuredStreamKind,
  isStructuredStreamType,
} from "../src/http.js";

describe("typespec-python: structured streaming", () => {
  it("treats model and union payloads as structured", () => {
    strictEqual(isStructuredStreamType({ kind: "model" } as any), true);
    strictEqual(isStructuredStreamType({ kind: "union" } as any), true);
  });

  it("unwraps nullable payloads", () => {
    strictEqual(isStructuredStreamType({ kind: "nullable", type: { kind: "model" } } as any), true);
    strictEqual(
      isStructuredStreamType({ kind: "nullable", type: { kind: "bytes" } } as any),
      false,
    );
  });

  it("treats bare byte/string payloads as unstructured", () => {
    strictEqual(isStructuredStreamType({ kind: "bytes" } as any), false);
    strictEqual(isStructuredStreamType({ kind: "string" } as any), false);
  });

  it("requires exact structured streaming media types", () => {
    strictEqual(
      getStructuredStreamKind({
        streamMetadata: { contentTypes: ["text/event-stream"] },
      } as any),
      "sse",
    );
    strictEqual(
      getStructuredStreamKind({
        streamMetadata: { contentTypes: ["application/jsonl"] },
      } as any),
      "jsonl",
    );
    strictEqual(
      getStructuredStreamKind({
        sseMetadata: { events: [] },
        streamMetadata: { contentTypes: ["text/event-stream; charset=utf-8"] },
      } as any),
      undefined,
    );
    strictEqual(
      getStructuredStreamKind({
        streamMetadata: { contentTypes: ["application/json"] },
      } as any),
      undefined,
    );
  });

  it("emits Azure JSONL metadata for a structured stream", () => {
    const itemType = { kind: "model", name: "Item", properties: [{}] };
    const context = {
      emitContext: { options: { flavor: "azure" } },
      __typesMap: new Map([[itemType, { type: "model", name: "Item" }]]),
      __simpleTypesMap: new Map(),
    };

    deepStrictEqual(
      emitStructuredStreamingInfo(
        context as any,
        {
          streamMetadata: {
            contentTypes: ["application/jsonl"],
            streamType: itemType,
          },
        } as any,
      ),
      {
        kind: "jsonl",
        itemType: { type: "model", name: "Item" },
      },
    );
  });

  it("emits SSE event and terminal metadata", () => {
    const itemType = { kind: "model", name: "Events", properties: [{}] };
    const connected = { kind: "model", name: "Connected", properties: [{}] };
    const message = { kind: "model", name: "Message", properties: [{}] };
    const terminal = {
      kind: "constant",
      value: "[DONE]",
      valueType: { kind: "string" },
    };
    const emitted = new Map([
      [itemType, { type: "combined", name: "Events" }],
      [connected, { type: "model", name: "Connected" }],
      [message, { type: "model", name: "Message" }],
    ]);
    const context = {
      emitContext: { options: { flavor: "azure" } },
      __typesMap: emitted,
      __simpleTypesMap: new Map(),
    };

    deepStrictEqual(
      emitStructuredStreamingInfo(
        context as any,
        {
          streamMetadata: {
            contentTypes: ["text/event-stream"],
            streamType: itemType,
          },
          sseMetadata: {
            events: [
              { eventType: "connected", payloadType: connected },
              { eventType: undefined, payloadType: message },
              {
                eventType: undefined,
                payloadType: terminal,
                type: terminal,
                isTerminalEvent: true,
              },
            ],
          },
        } as any,
      ),
      {
        kind: "sse",
        itemType: { type: "combined", name: "Events" },
        events: [
          {
            eventType: "connected",
            itemType: { type: "model", name: "Connected" },
          },
          {
            eventType: undefined,
            itemType: { type: "model", name: "Message" },
          },
        ],
        terminalEvent: "[DONE]",
      },
    );
  });

  it("explicitly excludes unbranded generation", () => {
    strictEqual(
      emitStructuredStreamingInfo(
        {
          emitContext: { options: { flavor: "unbranded" } },
          __typesMap: new Map(),
          __simpleTypesMap: new Map(),
        } as any,
        {
          streamMetadata: {
            contentTypes: ["application/jsonl"],
            streamType: { kind: "model" },
          },
        } as any,
      ),
      undefined,
    );
  });
});
