import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { isStructuredStreamType } from "../src/http.js";

describe("typespec-python: structured streaming", () => {
  it("treats model and union payloads as structured", () => {
    strictEqual(isStructuredStreamType({ kind: "model" } as any), true);
    strictEqual(isStructuredStreamType({ kind: "union" } as any), true);
  });

  it("unwraps nullable payloads", () => {
    strictEqual(isStructuredStreamType({ kind: "nullable", type: { kind: "model" } } as any), true);
    strictEqual(isStructuredStreamType({ kind: "nullable", type: { kind: "bytes" } } as any), false);
  });

  it("treats bare byte/string payloads as unstructured", () => {
    strictEqual(isStructuredStreamType({ kind: "bytes" } as any), false);
    strictEqual(isStructuredStreamType({ kind: "string" } as any), false);
  });
});
