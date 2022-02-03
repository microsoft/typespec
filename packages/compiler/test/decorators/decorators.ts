import { ok, strictEqual } from "assert";
import { getDoc, getFriendlyName, isErrorModel } from "../../lib/decorators.js";
import { createTestHost, TestHost } from "../../testing/index.js";

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

  describe("@friendlyName", () => {
    it("applies @doc on model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test
        @friendlyName("MyNameIsA")
        model A { }

        @test
        @friendlyName("{name}Model", B)
        model B { }

        @friendlyName("Templated{name}", T)
        model Templated<T> {
          prop: T;
        }

        @test
        model C is Templated<B>{};
        `
      );

      const { A, B, C } = await testHost.compile("./");
      strictEqual(getFriendlyName(testHost.program, A), "MyNameIsA");
      strictEqual(getFriendlyName(testHost.program, B), "BModel");
      strictEqual(getFriendlyName(testHost.program, C), "TemplatedB");
    });
  });

  describe("@error", () => {
    it("applies @error on model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test
        @error
        model A { }
        `
      );

      const { A } = await testHost.compile("./");
      ok(isErrorModel(testHost.program, A), "isError should be true");
    });

    it("emit diagnostic if error is not applied to a model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @error
        enum A { B, C }
        `
      );

      const [_, diagnostics] = await testHost.compileAndDiagnose("./");

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "decorator-wrong-target");
      strictEqual(diagnostics[0].message, `The @error decorator can only be applied to models.`);
    });
  });
});
