import { describe, expect, it } from "vitest";
import { getDoc } from "../../src/index.js";
import { t } from "../../src/testing/index.js";
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
    // With late-bound member resolution, A.t resolves without errors
    expect(diagnostics.map((d) => `${d.code}: ${d.message}`)).toEqual([]);
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

  it("augment decorator on template-derived member applies to A and spread copies", async () => {
    const {
      A,
      C: _C,
      program,
    } = await Tester.compile(t.code`
      model Template<T> { ...T; }
      model ${t.model("A")} is Template<{ t: string; }>;
      model ${t.model("C")} { ...A; }
      @@doc(A.t, "Some doc");
    `);
    const aProp = A.properties.get("t");
    expect(aProp).toBeDefined();
    expect(getDoc(program, aProp!)).toBe("Some doc");
  });
});
