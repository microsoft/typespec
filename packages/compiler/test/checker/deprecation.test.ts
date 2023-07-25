import { Diagnostic } from "../../src/index.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestRunner,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  TestHost,
} from "../../src/testing/index.js";

describe("compiler: checker: deprecation", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  function expectDeprecations(diagnostics: readonly Diagnostic[], deprecations: string[]) {
    expectDiagnostics(
      diagnostics,
      deprecations.map((x) => ({
        code: "deprecated",
        message: `Deprecated: ${x}`,
        severity: "warning",
      }))
    );
  }

  describe("#deprecated directive", () => {
    it("emits deprecation for use of deprecated model types", async () => {
      const diagnostics = await runner.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          op get(): OldFoo;

          model Bar {
            foo: string | OldFoo;
          }
          `);

      expectDeprecations(diagnostics, ["OldFoo is deprecated", "OldFoo is deprecated"]);
    });

    it("emits deprecation for use of model that extends deprecated parent", async () => {
      const diagnostics = await runner.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          model NewFoo extends OldFoo {} // Diagnostic here
          model IsFoo is NewFoo {} // Diagnostic here
          model NewIsFoo is IsFoo {} // No diagnostic here
          `);

      expectDeprecations(diagnostics, ["OldFoo is deprecated", "OldFoo is deprecated"]);
    });

    it("emits deprecation for use of deprecated model properties", async () => {
      const diagnostics = await runner.diagnose(`
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar {
            value: Foo.name;
          }

          op get(name: Foo.name): string;
          `);

      expectDeprecations(diagnostics, ["Use id instead", "Use id instead"]);
    });

    it("emits deprecation for use of deprecated model properties from extended models", async () => {
      const diagnostics = await runner.diagnose(`
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar extends Foo {}
          model Baz is Foo {}
          model Buz { ...Foo }

          op get(name: Bar.name): string;
          op put(name: Baz.name): string;
          op delete(name: Buz.name): string;
          `);

      expectDeprecations(diagnostics, ["Use id instead", "Use id instead", "Use id instead"]);
    });

    it("emits deprecation for use of deprecated operation type", async () => {
      const diagnostics = await runner.diagnose(`
          #deprecated "oldGet is deprecated"
          op oldGet(): string;

          op someGet is oldGet; // Diagnostic here
          op newGet is someGet; // No diagnostic here
         `);

      expectDeprecations(diagnostics, ["oldGet is deprecated"]);
    });

    it("emits deprecation for references of deprecated operations from extended interfaces", async () => {
      const diagnostics = await runner.diagnose(`
            interface Foo {
              #deprecated "Foo is deprecated"
              foo(): void;
            }

            interface Bar extends Foo {}

            op baz is Bar.foo;
          `);

      expectDeprecations(diagnostics, ["Foo is deprecated"]);
    });

    it("emits deprecation for usage on alias types", async () => {
      const diagnostics = await runner.diagnose(`
          model Foo<T> { val: T; }

          #deprecated "StringFoo is deprecated"
          alias StringFoo = Foo<string>;

          op oldGet(): StringFoo;
          `);

      expectDeprecations(diagnostics, ["StringFoo is deprecated"]);
    });

    it("emits deprecation for use of deprecated decorator signatures", async () => {
      const testHost: TestHost = await createTestHost();
      testHost.addJsFile("test.js", { $testDec: () => {} });
      const runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });

      const diagnostics = await runner.diagnose(`
          #deprecated "testDec is deprecated"
          extern dec testDec(target: Model);

          @testDec
          model Foo {}
          `);

      expectDeprecations(diagnostics, ["testDec is deprecated"]);
    });
  });

  describe("@deprecated decorator", () => {
    it("doesn't emit warning until it is used", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }
        model Test  { }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit warning diagnostic when used via is", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }

        model Test is Foo { }
      `);
      expectDiagnostics(diagnostics, {
        code: "deprecated",
        message: "Deprecated: Foo is deprecated use Bar",
        severity: "warning",
      });
    });

    it("emit warning diagnostic when used via extends", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }

        model Test extends Foo { }
      `);
      expectDiagnostics(diagnostics, {
        code: "deprecated",
        message: "Deprecated: Foo is deprecated use Bar",
        severity: "warning",
      });
    });

    it("emit warning diagnostic when used via property type", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }

        model Test { foo: Foo }
      `);
      expectDiagnostics(diagnostics, {
        code: "deprecated",
        message: "Deprecated: Foo is deprecated use Bar",
        severity: "warning",
      });
    });

    it("emit warning diagnostic when used via spread", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }

        model Test { ...Foo }
      `);
      expectDiagnostics(diagnostics, {
        code: "deprecated",
        message: "Deprecated: Foo is deprecated use Bar",
        severity: "warning",
      });
    });
  });

  describe("--ignore-deprecated flag", () => {
    it("suppresses deprecation warnings", async () => {
      const diagnostics = await runner.diagnose(
        `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          op get(): OldFoo;

          model Bar {
            foo: string | OldFoo;
          }
      `,
        {
          ignoreDeprecated: true,
        }
      );

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
