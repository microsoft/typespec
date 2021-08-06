import { match, strictEqual } from "assert";
import { Diagnostic } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: duplicate declarations", () => {
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

    const diagnostics = await testHost.diagnose("/");
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

    const diagnostics = await testHost.diagnose("/");
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

    const diagnostics = await testHost.diagnose("/");
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

    const diagnostics = await testHost.diagnose("/");
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

    const diagnostics = await testHost.diagnose("/");
    assertDuplicates(diagnostics);
  });
});

function assertDuplicates(diagnostics: readonly Diagnostic[]) {
  strictEqual(diagnostics.length, 2);
  for (const diagnostic of diagnostics) {
    match(diagnostic.message, /Duplicate name/);
  }
}
