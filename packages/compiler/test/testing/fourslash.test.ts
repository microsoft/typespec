import { describe, expect, it } from "vitest";
import { extractMarkers } from "../../src/testing/fourslash.js";

describe("extractMarkers", () => {
  it("marks the pos right after the fourslash syntax", () => {
    const code = `model /*foo*/Foo {}`;
    const markers = extractMarkers(code);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ name: "foo" });
    expect(code.slice(markers[0].pos, markers[0].pos + 3)).toBe("Foo");
  });

  it("extracts multiple markers", () => {
    const code = `model /*foo*/Foo {}\nmodel /*bar*/Bar {}`;
    const markers = extractMarkers(code);
    expect(markers).toHaveLength(2);
    expect(markers[0].name).toBe("foo");
    expect(code.slice(markers[0].pos, markers[0].pos + 3)).toBe("Foo");
    expect(markers[1].name).toBe("bar");
    expect(code.slice(markers[1].pos, markers[1].pos + 3)).toBe("Bar");
  });

  it("extracts marker with identifier containing numbers and underscores", () => {
    const code = `model /*foo*/Foo_123 {}`;
    const markers = extractMarkers(code);
    expect(markers).toHaveLength(1);
    expect(markers[0].name).toBe("foo");
    expect(code.slice(markers[0].pos, markers[0].pos + 7)).toBe("Foo_123");
  });
});
