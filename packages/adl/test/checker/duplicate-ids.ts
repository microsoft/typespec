import { match, strictEqual } from "assert";
import { Diagnostic } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("adl: duplicate declarations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("reports duplicate template parameters", async () => {
    testHost.addAdlFile(
      "main.adl",
      `
      model A<T, T> { }
    `
    );

    const diagnostics = await testHost.diagnose("/");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in global scope", async () => {
    testHost.addAdlFile(
      "main.adl",
      `
      model A { }
      model A { }
    `
    );

    const diagnostics = await testHost.diagnose("/");
    assertDuplicates(diagnostics);
  });

  it("reports duplicate model declarations in a single namespace", async () => {
    testHost.addAdlFile(
      "main.adl",
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
    testHost.addAdlFile(
      "main.adl",
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
    testHost.addAdlFile(
      "main.adl",
      `
      import "./a.adl";
      import "./b.adl";
      `
    );
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N {
        model A { };
      }
    `
    );
    testHost.addAdlFile(
      "b.adl",
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
