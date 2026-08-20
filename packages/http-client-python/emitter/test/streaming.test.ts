import { strictEqual } from "assert";
import { describe, it } from "vitest";
import {
  getStructuredStreamKind,
  isStructuredStreamType,
  partitionSseEvents,
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

  it("detects the stream protocol explicitly", () => {
    strictEqual(getStructuredStreamKind({ sseMetadata: { events: [] } } as any), "sse");
    strictEqual(
      getStructuredStreamKind({
        streamMetadata: { contentTypes: ["text/event-stream; charset=utf-8"] },
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
        streamMetadata: { contentTypes: ["application/json"] },
      } as any),
      undefined,
    );
  });

  describe("terminal-event partitioning", () => {
    const identity = (payloadType: any) => payloadType;
    const model = (name: string) => ({ kind: "model", name });
    const constant = (value: string) => ({ kind: "constant", value });

    it("keeps a nameless string-constant `[DONE]` as a drop-and-stop sentinel", () => {
      const created = model("ResponseCreated");
      const done = constant("[DONE]");
      const { events, terminalEvent } = partitionSseEvents(
        [
          {
            eventType: "response.created",
            isTerminalEvent: false,
            type: created,
            payloadType: created,
          },
          { eventType: undefined, isTerminalEvent: true, type: done, payloadType: done },
        ] as any,
        identity,
      );
      // The sentinel is NOT a dispatch event; it only sets `terminalEvent`.
      strictEqual(terminalEvent, "[DONE]");
      strictEqual(events.length, 1);
      strictEqual(events[0].eventType, "response.created");
      strictEqual(events[0].isTerminal, undefined);
    });

    it("keeps named / model `@terminalEvent`s in the dispatch table as yield-and-stop events", () => {
      const created = model("ResponseCreated");
      const completed = model("ResponseCompleted");
      const errored = model("StreamError");
      const { events, terminalEvent } = partitionSseEvents(
        [
          {
            eventType: "response.created",
            isTerminalEvent: false,
            type: created,
            payloadType: created,
          },
          {
            eventType: "response.completed",
            isTerminalEvent: true,
            type: completed,
            payloadType: completed,
          },
          { eventType: "error", isTerminalEvent: true, type: errored, payloadType: errored },
        ] as any,
        identity,
      );
      // No bare sentinel: the two terminals carry payloads, so they stay in `events`.
      strictEqual(terminalEvent, undefined);
      strictEqual(events.length, 3);
      strictEqual(events[0].isTerminal, undefined);
      strictEqual(events[1].eventType, "response.completed");
      strictEqual(events[1].isTerminal, true);
      strictEqual(events[1].itemType, completed);
      strictEqual(events[2].eventType, "error");
      strictEqual(events[2].isTerminal, true);
      strictEqual(events[2].itemType, errored);
    });

    it("supports a sentinel and named terminals together", () => {
      const delta = model("ResponseDelta");
      const completed = model("ResponseCompleted");
      const done = constant("[DONE]");
      const { events, terminalEvent } = partitionSseEvents(
        [
          { eventType: "response.delta", isTerminalEvent: false, type: delta, payloadType: delta },
          {
            eventType: "response.completed",
            isTerminalEvent: true,
            type: completed,
            payloadType: completed,
          },
          { eventType: undefined, isTerminalEvent: true, type: done, payloadType: done },
        ] as any,
        identity,
      );
      strictEqual(terminalEvent, "[DONE]");
      strictEqual(events.length, 2);
      strictEqual(events[0].isTerminal, undefined);
      strictEqual(events[1].eventType, "response.completed");
      strictEqual(events[1].isTerminal, true);
    });
  });
});
