import { describe, expect, it } from "vitest";
import { serializeCodeModel } from "../src/code-model-serializer.js";

describe("typespec-python: code model serialization", () => {
  // With the previous YAML format, a plain scalar such as `2020_01_01` (a snake-cased
  // enum member name) had to be force-quoted, otherwise PyYAML (YAML 1.1) read it back as
  // the integer `20200101`. JSON encodes strings unambiguously, so such values round-trip
  // as strings without any special handling.
  it("preserves string values that YAML 1.1 would have misinterpreted", () => {
    const json = serializeCodeModel({ name: "2020_01_01", value: "2020-01-01", plain: "hello" });
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("2020_01_01");
    expect(parsed.value).toBe("2020-01-01");
    expect(parsed.plain).toBe("hello");
  });

  it("encodes shared references with $id/$ref instead of duplicating them", () => {
    const shared = { kind: "string" };
    const parsed = JSON.parse(serializeCodeModel({ a: shared, b: shared }));
    expect(parsed.a.$id).toBeDefined();
    expect(parsed.a.kind).toBe("string");
    // The second reference to the same object is a $ref back to the first occurrence.
    expect(parsed.b).toEqual({ $ref: parsed.a.$id });
  });

  it("encodes arrays with $id/$values and preserves cycles as $ref", () => {
    const node: Record<string, unknown> = { kind: "model" };
    node.self = node; // cyclic reference back to itself
    const parsed = JSON.parse(serializeCodeModel({ items: [node] }));
    expect(parsed.items.$values).toBeDefined();
    const first = parsed.items.$values[0];
    // The cycle is encoded as a $ref back to the enclosing node.
    expect(first.self).toEqual({ $ref: first.$id });
  });
});
