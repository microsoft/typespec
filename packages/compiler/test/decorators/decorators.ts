import { ok, strictEqual } from "assert";
import { ModelType } from "../../core/index.js";
import { getDoc, getFriendlyName, getKnownValues, isErrorModel } from "../../lib/decorators.js";
import { BasicTestRunner, createTestRunner, expectDiagnostics } from "../../testing/index.js";

describe("compiler: built-in decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  describe("@doc", () => {
    it("applies @doc on model", async () => {
      const { A } = await runner.compile(
        `
        @test
        @doc("My Doc")
        model A { }
        `
      );

      strictEqual(getDoc(runner.program, A), "My Doc");
    });

    it("formats @doc string using source object", async () => {
      const { A, B } = await runner.compile(
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
      strictEqual(getDoc(runner.program, A), "Model A");
      strictEqual(getDoc(runner.program, B), "Templated B");
    });

    it("emit diagnostic if doc is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @doc("foo" | "bar")
        model A { }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: `Argument 'foo | bar' of type 'Union' is not assignable to parameter of type 'String'`,
      });
    });
  });

  describe("@friendlyName", () => {
    it("applies @doc on model", async () => {
      const { A, B, C } = await runner.compile(`
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
        `);
      strictEqual(getFriendlyName(runner.program, A), "MyNameIsA");
      strictEqual(getFriendlyName(runner.program, B), "BModel");
      strictEqual(getFriendlyName(runner.program, C), "TemplatedB");
    });
  });

  describe("@error", () => {
    it("applies @error on model", async () => {
      const { A } = await runner.compile(`
        @test
        @error
        model A { }
      `);
      ok(isErrorModel(runner.program, A), "isError should be true");
    });

    it("emit diagnostic if error is not applied to a model", async () => {
      const diagnostics = await runner.diagnose(`
        @error
        enum A { B, C }
        `);

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "decorator-wrong-target");
      strictEqual(diagnostics[0].message, `Cannot apply @error decorator to Enum`);
    });
  });

  describe("@knownValues", () => {
    it("assign the known values to string model", async () => {
      const { Bar } = (await runner.compile(`
        enum Foo {one, two}
        @test
        @knownValues(Foo)
        model Bar extends string {}
      `)) as { Bar: ModelType };

      ok(Bar.kind);
      const knownValues = getKnownValues(runner.program, Bar);
      ok(knownValues);
      strictEqual(knownValues.kind, "Enum");
    });

    it("emit diagnostics when used on non model", async () => {
      const diagnostics = await runner.diagnose(`
        enum Foo {one, two}
        @knownValues(Foo)
        enum Bar {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @knownValues decorator to non 'string' type",
      });
    });

    it("emit diagnostics when used on non string model", async () => {
      const diagnostics = await runner.diagnose(`
        enum Foo {one, two}
        @knownValues(Foo)
        model Bar {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @knownValues decorator to non 'string' type",
      });
    });

    it("emit diagnostics when known values is not an enum", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {}
        @knownValues(Foo)
        model Bar extends string {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument 'Foo' of type 'Model' is not assignable to parameter of type 'Enum'",
      });
    });
  });
});
