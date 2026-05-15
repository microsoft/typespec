import { describe, it, expect } from "vitest";
import { Model } from "../../src/core/types.js";
import { Tester } from "../tester.js";

describe("circular reference with template spread and member access", () => {
  it("model A is Template<{t: B}> with B accessing A.t", async () => {
    const diagnostics = await Tester.diagnose(`
      model Template<T> {...T}

      model A is Template<{t: B}>;

      model B {
        a: A.t;
      }
    `);
    // Should have no errors — A.t should resolve to the 't' property
    expect(diagnostics.map(d => `${d.code}: ${d.message}`)).toEqual([]);
  });
});
