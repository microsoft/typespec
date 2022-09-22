import { Diagnostic } from "../../core/types.js";
import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("compiler: duplicate declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("reports duplicate template parameters", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model A<T, T> { }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in global scope", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model A { }
      model A { }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in a single namespace", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace Foo;
      model A { }
      model A { }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations across multiple namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace N {
        model A { };
      }

      namespace N {
        model A { };
      }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations across multiple files and namespaces", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      namespace N {
        model A { };
      }
    `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace N {
        model A { };
      }
    `
    );

    const diagnostics = await testHost.diagnose("./");
    assertDuplicates(diagnostics);
  });

  describe("reports duplicate namespace/non-namespace across multiple files", () => {
    // NOTE: Different order of declarations triggers different code paths, so test both
    it("with namespace first", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./a.cadl";
        import "./b.cadl";
        `
      );
      testHost.addCadlFile("a.cadl", "namespace N {}");
      testHost.addCadlFile("b.cadl", "model N {}");
      const diagnostics = await testHost.diagnose("./");
      assertDuplicates(diagnostics);
    });
    it("with non-namespace first", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./a.cadl";
        import "./b.cadl";
        `
      );
      testHost.addCadlFile("a.cadl", "model MMM {}");
      testHost.addCadlFile(
        "b.cadl",
        `namespace MMM {
           // Also check that we don't drop local dupes when the namespace is discarded.
           model QQQ {}
           model QQQ {}
         }`
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

function assertDuplicates(diagnostics: readonly Diagnostic[]) {
  expectDiagnostics(diagnostics, [{ code: "duplicate-symbol" }, { code: "duplicate-symbol" }]);
}
