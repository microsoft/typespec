import { describe, expect, it } from "vitest";
import { Tester } from "../tester.js";

describe("circular model resolution", () => {
  it("non-circular: model A is Template<{t: string}> with B accessing A.t", async () => {
    const diagnostics = await Tester.diagnose(`
      model Template<T> {...T}
      model A is Template<{t: string}>;
      model B { a: A.t; }
    `);
    expect(diagnostics.map((d) => `${d.code}: ${d.message}`)).toEqual([]);
  });

  it("direct members: model A { t: B } with B accessing A.t", async () => {
    const diagnostics = await Tester.diagnose(`
      model A { t: B }
      model B { a: A.t; }
    `);
    // circular-prop is expected since A.t references B and B.a references A.t
    expect(diagnostics.map((d) => d.code)).toContain("circular-prop");
  });

  it("circular: model A is Template<{t: B}> with B accessing A.t", async () => {
    const diagnostics = await Tester.diagnose(`
      model Template<T> {...T}
      model A is Template<{t: B}>;
      model B { a: A.t; }
    `);
    // A.t should resolve to the 't' property (type B) after A finishes via deferred resolution
    expect(diagnostics.map((d) => `${d.code}: ${d.message}`)).toEqual([]);
  });
});
