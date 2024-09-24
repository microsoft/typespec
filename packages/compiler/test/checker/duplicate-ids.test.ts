import { beforeEach, describe, it } from "vitest";
import { Diagnostic } from "../../src/core/types.js";
import { TestHost, createTestHost, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: duplicate declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("reports duplicate template parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model A<T, T> { }
    `,
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in global scope", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model A { }
      model A { }
    `,
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in a single namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Foo;
      model A { }
      model A { }
    `,
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations across multiple namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace N {
        model A { };
      }

      namespace N {
        model A { };
      }
    `,
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations across multiple files and namespaces", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      `,
    );
    testHost.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A { };
      }
    `,
    );
    testHost.addTypeSpecFile(
      "b.tsp",
      `
      namespace N {
        model A { };
      }
    `,
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  describe("reports duplicate namespace/non-namespace", () => {
    describe("in same file", () => {
      it("with namespace first", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          namespace N {}
          model N {}
          `,
        );
        const diagnostics = await testHost.diagnose("./");
        assertDuplicates(diagnostics);
      });

      it("with non-namespace first", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          model N {}
          namespace N {}
          `,
        );
        testHost.addTypeSpecFile("a.tsp", "namespace N {}");
        testHost.addTypeSpecFile("b.tsp", "model N {}");
        const diagnostics = await testHost.diagnose("./");
        assertDuplicates(diagnostics);
      });
    });

    describe("across multiple files", () => {
      // NOTE: Different order of declarations triggers different code paths, so test both
      it("with namespace first", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          import "./a.tsp";
          import "./b.tsp";
          `,
        );
        testHost.addTypeSpecFile("a.tsp", "namespace N {}");
        testHost.addTypeSpecFile("b.tsp", "model N {}");
        const diagnostics = await testHost.diagnose("./");
        assertDuplicates(diagnostics);
      });
      it("with non-namespace first", async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          import "./a.tsp";
          import "./b.tsp";
          `,
        );
        testHost.addTypeSpecFile("a.tsp", "model MMM {}");
        testHost.addTypeSpecFile(
          "b.tsp",
          `namespace MMM {
             // Also check that we don't drop local dupes when the namespace is discarded.
             model QQQ {}
             model QQQ {}
           }`,
        );
        const diagnostics = await testHost.diagnose("./");
        expectDiagnostics(diagnostics, [
          { code: "duplicate-symbol", message: /MMM/ },
          { code: "duplicate-symbol", message: /MMM/ },
          { code: "duplicate-symbol", message: /QQQ/ },
          { code: "duplicate-symbol", message: /QQQ/ },
        ]);
      });
    });
  });
});

function assertDuplicates(diagnostics: readonly Diagnostic[]) {
  expectDiagnostics(diagnostics, [{ code: "duplicate-symbol" }, { code: "duplicate-symbol" }]);
}
