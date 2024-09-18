import { beforeEach, describe, it } from "vitest";
import { Diagnostic } from "../../src/index.js";
import {
  BasicTestRunner,
  DiagnosticMatch,
  TestHost,
  createTestHost,
  createTestRunner,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../src/testing/index.js";

describe("compiler: checker: deprecation", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function expectDeprecations(
    source: string,
    deprecations: string[],
    testRunner: BasicTestRunner = runner,
  ) {
    const expectedDiagnostics: DiagnosticMatch[] = [];
    for (const deprecation of deprecations) {
      const { source: newSource, pos } = extractCursor(source);
      expectedDiagnostics.push({
        code: "deprecated",
        message: `Deprecated: ${deprecation}`,
        severity: "warning",
        pos,
      });

      // Continue with the updated source
      source = newSource;
    }

    expectDiagnostics(await testRunner.diagnose(source), expectedDiagnostics);
  }

  describe("#deprecated directive", () => {
    it("emits deprecation for use of deprecated model types", async () => {
      await expectDeprecations(
        `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          op get(): ┆OldFoo;

          model Bar {
            foo: string | ┆OldFoo;
          }
        `,
        ["OldFoo is deprecated", "OldFoo is deprecated"],
      );
    });

    it("emits deprecation for use of model that extends deprecated parent", async () => {
      await expectDeprecations(
        `
          #deprecated "OldFoo is deprecated"
          model OldFoo {}

          model NewFoo extends ┆OldFoo {}
          model IsFoo is ┆NewFoo {}
          model NewIsFoo is IsFoo {}
          `,
        ["OldFoo is deprecated", "OldFoo is deprecated"],
      );
    });

    it("emits deprecation for use of deprecated model properties", async () => {
      await expectDeprecations(
        `
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar {
            value: ┆Foo.name;
          }

          op get(name: ┆Foo.name): string;
        `,
        ["Use id instead", "Use id instead"],
      );
    });

    it("emits deprecation for use of deprecated model properties from extended models", async () => {
      await expectDeprecations(
        `
          model Foo {
            #deprecated "Use id instead"
            name: string;
          }

          model Bar extends Foo {}
          model Baz is Foo {}
          model Buz { ...Foo }

          op get(name: ┆Bar.name): string;
          op put(name: ┆Baz.name): string;
          op delete(name: ┆Buz.name): string;
        `,
        ["Use id instead", "Use id instead", "Use id instead"],
      );
    });

    it("emits deprecation for use of deprecated templated model", async () => {
      await expectDeprecations(
        `
        #deprecated "Foo is deprecated"
        model Foo<T> {}

        model Bar {
          foo: ┆Foo<string>;
        }
        `,
        ["Foo is deprecated"],
      );
    });

    it("emits deprecation for use of deprecated scalar", async () => {
      await expectDeprecations(
        `
          #deprecated "Name is deprecated"
          scalar Name extends string;
          scalar OtherName extends ┆Name;

          model Bar {
            name: ┆Name;
            otherName: ┆OtherName;
          }
          `,
        ["Name is deprecated", "Name is deprecated", "Name is deprecated"],
      );
    });

    it("emits deprecation for use of deprecated operation type", async () => {
      await expectDeprecations(
        `
          #deprecated "oldGet is deprecated"
          op oldGet(): string;

          op someGet is ┆oldGet;
          op newGet is someGet; // No diagnostic here
         `,
        ["oldGet is deprecated"],
      );
    });

    it("emits deprecation for references of deprecated operations from extended interfaces", async () => {
      await expectDeprecations(
        `
          interface Foo {
            #deprecated "Foo is deprecated"
            foo(): void;
          }

          interface Bar extends Foo {}

          op baz is ┆Bar.foo;
        `,
        ["Foo is deprecated"],
      );
    });

    it("emits deprecation for usage on alias types", async () => {
      await expectDeprecations(
        `
          model Foo<T> { val: T; }
          model Bar {}

          #deprecated "StringFoo is deprecated"
          alias StringFoo = Foo<string>;

          op get(): ┆StringFoo;
          op otherGet(): Foo<string>; // No diagnostic here, only on alias
          op put(str: string | ┆StringFoo): void;

          model Baz {
            foo: ┆StringFoo;
          }
        `,
        ["StringFoo is deprecated", "StringFoo is deprecated", "StringFoo is deprecated"],
      );
    });

    it("emits deprecation for use of deprecated decorator signatures", async () => {
      const testHost: TestHost = await createTestHost();
      testHost.addJsFile("test.js", { $testDec: () => {} });
      const runner = createTestWrapper(testHost);

      await expectDeprecations(
        `
        import "./test.js";
        using TypeSpec.Reflection;

        #deprecated "testDec is deprecated"
        extern dec testDec(target: Model);

        ┆@testDec
        model Foo {}
        `,
        ["testDec is deprecated"],
        runner,
      );
    });

    it("emits diagnostic when multiple #deprecated directives are used on a node", async () => {
      const diagnostics = await runner.diagnose(`
          #deprecated "Foo is deprecated"
          #deprecated "Foo is deprecated again"
          model Foo {}
          `);

      expectDiagnostics(diagnostics, [{ code: "duplicate-deprecation" }]);
    });

    describe("referencing in template constraint", () => {
      it("emits diagnostic when template is not instantiated", async () => {
        await expectDeprecations(
          `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T extends ┆OldFoo> {}
          `,
          ["OldFoo is deprecated"],
        );
      });

      it("doesn't emit more diagnostic if instantiating template", async () => {
        await expectDeprecations(
          `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T extends ┆OldFoo> {}
          
            alias T1 = Bar<{one: string}>;
            alias T2 = Bar<{two: string}>;
          `,
          ["OldFoo is deprecated"],
        );
      });

      it("can suppress", async () => {
        const diagnostics = await runner.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}
          
          #suppress "deprecated" "Using it anyway"
          model Bar<T extends OldFoo> {}
        `);

        expectDiagnosticEmpty(diagnostics);
      });
    });

    describe("referencing in template argument", () => {
      it("emits diagnostic", async () => {
        await expectDeprecations(
          `
            #deprecated "OldFoo is deprecated"
            model OldFoo {}
            
            model Bar<T> {...T}

            alias T1 = Bar<┆OldFoo>;
          `,
          ["OldFoo is deprecated"],
        );
      });

      it("can suppress", async () => {
        const diagnostics = await runner.diagnose(`
          #deprecated "OldFoo is deprecated"
          model OldFoo {}
          
          model Bar<T> {...T}

          #suppress "deprecated" "Using it anyway"
          alias T1 = Bar<OldFoo>;
        `);

        expectDiagnosticEmpty(diagnostics);
      });
    });

    it("can have its diagnostics suppressed", async () => {
      // cspell:ignore Morp
      const diagnostics = await runner.diagnose(`
        #deprecated "Foo is deprecated"
        model Foo {
          #deprecated "Name is deprecated"
          name: string;
        }

        model Bar {
          #suppress "deprecated" "Using it anyway"
          name: Foo;
        }

        op foo(
          #suppress "deprecated" "Using it anyway"
          foo: Foo
        ): string;

        model Baz {
          #suppress "deprecated" "Using it anyway"
          ...Foo;
        }

        model Buz {
          #suppress "deprecated" "Using it anyway"
          name: Foo.name;
        }
        `);

      expectDiagnosticEmpty(diagnostics);
    });

    describe("skips type deprecation warning when referenced in a deprecated parent context", () => {
      it("deprecated model used in deprecated types", async () => {
        await expectDeprecations(
          `
            #deprecated "OldFoo is deprecated"
            model OldFoo {
              foo: string;
            }

            #deprecated "oldOp is deprecated"
            op oldOp(): OldFoo;

            #deprecated "OldBar is deprecated"
            model OldBar is OldFoo {}

            #deprecated "OldBlah is deprecated"
            model OldBlah extends OldFoo {}

            #deprecated "OldFooReference is deprecated"
            model OldFooReference {
              foo: OldFoo.foo;
            }

            #deprecated "OldFooProperty is deprecated"
            model OldFooProperty {
              foo: OldFoo;
            }

            #deprecated "OldBaz is deprecated"
            interface OldBaz {
              op oldBaz(): OldFoo;
              op oldBazTwo(): string | OldFoo;
              op oldBazThree(): OldFoo & { bar: string };
            }
          `,
          [],
        );
      });

      it("deprecated operation used in deprecated types", async () => {
        await expectDeprecations(
          `
            #deprecated "oldFoo is deprecated"
            op oldFoo(): string;

            #deprecated "oldBar is deprecated"
            op oldBar is oldFoo;

            #deprecated "OldBaz is deprecated"
            interface OldBaz {
              op oldBaz is oldBar;
            }
          `,
          [],
        );
      });
    });
  });

  describe("@deprecated decorator", () => {
    function omitDeprecatedDecoratorDeprecatedDiag(
      diagnostics: readonly Diagnostic[],
    ): readonly Diagnostic[] {
      return diagnostics.filter(
        (x) =>
          !(
            x.code === "deprecated" &&
            x.message ===
              "Deprecated: @deprecated decorator is deprecated. Use the `#deprecated` directive instead."
          ),
      );
    }
    it("doesn't emit warning until it is used", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }
        model Test  { }
      `);
      expectDiagnosticEmpty(omitDeprecatedDecoratorDeprecatedDiag(diagnostics));
    });

    it("emit warning diagnostic when used via is", async () => {
      const diagnostics = await runner.diagnose(`
        @deprecated("Foo is deprecated use Bar")
        model Foo { }

        model Test is Foo { }
      `);
      expectDiagnostics(omitDeprecatedDecoratorDeprecatedDiag(diagnostics), {
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
      expectDiagnostics(omitDeprecatedDecoratorDeprecatedDiag(diagnostics), {
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
      expectDiagnostics(omitDeprecatedDecoratorDeprecatedDiag(diagnostics), {
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
      expectDiagnostics(omitDeprecatedDecoratorDeprecatedDiag(diagnostics), {
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
        },
      );

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
