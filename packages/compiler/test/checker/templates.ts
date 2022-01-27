import { deepStrictEqual, fail, strictEqual } from "assert";
import { getSourceLocation } from "../../core/diagnostics.js";
import { Diagnostic } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("compiler: templates", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function getLineAndCharOfDiagnostic(diagnostic: Diagnostic) {
    const source = getSourceLocation(diagnostic.target);
    if (source === undefined) {
      fail(`Couldn't resolve the source of diagnostic ${diagnostic}`);
    }
    return source.file.getLineAndCharacterOfPosition(source.pos);
  }

  it("emit diagnostics when using template params on non templated model", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
        model A {}
        model B { 
          foo: A<string>
        };
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Can't pass template arguments to non-templated type");
    // Should point to the start of A<string>
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });

  it("emit diagnostics when using template without passing any arguments", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
        model A<T> {}
        model B { 
          foo: A
        };
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Too few template arguments provided.");
    // Should point to the start of A
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });

  it("emit diagnostics when using template with too many arguments", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
        model A<T> {}
        model B { 
          foo: A<string, string>
        };
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "invalid-template-args");
    strictEqual(diagnostics[0].message, "Too many template arguments provided.");

    // Should point to the start of A<string, string>
    deepStrictEqual(getLineAndCharOfDiagnostic(diagnostics[0]), {
      line: 3,
      character: 15,
    });
  });
});
