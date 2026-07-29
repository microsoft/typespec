import { describe, it } from "vitest";
import { Diagnostic } from "../../src/core/types.js";
import { expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

it("reports duplicate template parameters", async () => {
  const diagnostics = await Tester.diagnose(`
      model A<T, T> { }
    `);
  assertDuplicates(diagnostics);
});

it("reports duplicate model declarations in global scope", async () => {
  const diagnostics = await Tester.diagnose(`
      model A { }
      model A { }
    `);
  assertDuplicates(diagnostics);
});

it("reports duplicate model declarations in a single namespace", async () => {
  const diagnostics = await Tester.diagnose(`
      namespace Foo;
      model A { }
      model A { }
    `);
  assertDuplicates(diagnostics);
});

it("reports duplicate model declarations across multiple namespaces", async () => {
  const diagnostics = await Tester.diagnose(`
      namespace N {
        model A { };
      }

      namespace N {
        model A { };
      }
    `);
  assertDuplicates(diagnostics);
});

it("reports duplicate model declarations across multiple files and namespaces", async () => {
  const diagnostics = await Tester.files({
    "a.tsp": `
      namespace N {
        model A { };
      }
    `,
    "b.tsp": `
      namespace N {
        model A { };
      }
    `,
  }).diagnose(`
      import "./a.tsp";
      import "./b.tsp";
    `);
  assertDuplicates(diagnostics);
});

describe("reports duplicate namespace/non-namespace", () => {
  describe("in same file", () => {
    it("with namespace first", async () => {
      const diagnostics = await Tester.diagnose(`
          namespace N {}
          model N {}
        `);
      assertDuplicates(diagnostics);
    });

    it("with non-namespace first", async () => {
      const diagnostics = await Tester.files({
        "a.tsp": "namespace N {}",
        "b.tsp": "model N {}",
      }).diagnose(`
          model N {}
          namespace N {}
        `);
      assertDuplicates(diagnostics);
    });
  });

  describe("across multiple files", () => {
    // NOTE: Different order of declarations triggers different code paths, so test both
    it("with namespace first", async () => {
      const diagnostics = await Tester.files({
        "a.tsp": "namespace N {}",
        "b.tsp": "model N {}",
      }).diagnose(`
          import "./a.tsp";
          import "./b.tsp";
        `);
      assertDuplicates(diagnostics);
    });
    it("with non-namespace first", async () => {
      const diagnostics = await Tester.files({
        "a.tsp": "model MMM {}",
        "b.tsp": `namespace MMM {
             // Also check that we don't drop local dupes when the namespace is discarded.
             model QQQ {}
             model QQQ {}
           }`,
      }).diagnose(`
          import "./a.tsp";
          import "./b.tsp";
        `);
      expectDiagnostics(diagnostics, [
        { code: "duplicate-symbol", message: /MMM/ },
        { code: "duplicate-symbol", message: /MMM/ },
        { code: "duplicate-symbol", message: /QQQ/ },
        { code: "duplicate-symbol", message: /QQQ/ },
      ]);
    });
  });
});

function assertDuplicates(diagnostics: readonly Diagnostic[]) {
  expectDiagnostics(diagnostics, [{ code: "duplicate-symbol" }, { code: "duplicate-symbol" }]);
}
