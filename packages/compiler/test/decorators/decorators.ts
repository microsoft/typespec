import { strictEqual } from "assert";
import { getDoc } from "../../lib/decorators.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("compiler: built-in decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  describe("@doc", () => {
    it("applies @doc on model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test
        @doc("My Doc")
        model A { }
        `
      );

      const { A } = await testHost.compile("./");
      strictEqual(getDoc(testHost.program, A), "My Doc");
    });

    it("formats @doc string using source object", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @doc("Templated {name}", T)
        model Template<T>  {
        }

        @test
        @doc("Model {name}", A)
        model A { }

        @test
        model B is Template<B> {
        }
        `
      );

      const { A, B } = await testHost.compile("./");
      strictEqual(getDoc(testHost.program, A), "Model A");
      strictEqual(getDoc(testHost.program, B), "Templated B");
    });

    it("emit diagnostic if doc is not a string", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      @doc("foo" | "bar")
      model A { }
      `
      );

      const [_, diagnostics] = await testHost.compileAndDiagnose("./");

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "invalid-argument");
      strictEqual(
        diagnostics[0].message,
        `Argument 'foo | bar' of type 'object' is not assignable to parameter of type 'string'`
      );
    });
  });
});
