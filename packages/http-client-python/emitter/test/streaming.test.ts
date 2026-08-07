import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getStructuredStreamKind, isStructuredStreamType } from "../src/http.js";

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
});
