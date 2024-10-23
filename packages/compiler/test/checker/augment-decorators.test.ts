import { deepEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, Operation, StringLiteral, Type } from "../../src/core/types.js";
import { TestHost, createTestHost, expectDiagnosticEmpty } from "../../src/testing/index.js";

describe("compiler: checker: augment decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("run decorator without arguments", async () => {
    let blueThing: Type | undefined;

    testHost.addJsFile("test.js", {
      $blue(_: any, t: Type) {
        blueThing = t;
      },
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
      import "./test.js";

      @test model Foo { };

      @@blue(Foo);
      `,
    );

    const { Foo } = await testHost.compile("test.tsp");
    strictEqual(Foo, blueThing);
  });

  it("run decorator with arguments", async () => {
    let customName: string | undefined;

    testHost.addJsFile("test.js", {
      $customName(_: any, t: Type, n: StringLiteral) {
        customName = n.value;
      },
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
      import "./test.js";

      model Foo { };

      @@customName(Foo, "FooCustom");
      `,
    );

    await testHost.compile("test.tsp");
    strictEqual(customName, "FooCustom");
  });

  describe("declaration scope", () => {
    let blueThing: Type | undefined;

    beforeEach(() => {
      blueThing = undefined;
      testHost.addJsFile("test.js", {
        $blue(_: any, t: Type) {
          blueThing = t;
        },
      });
    });

    it("can be defined at the root of document", async () => {
      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";
  
        @test model Foo { };
  
        @@blue(Foo);
        `,
      );

      const { Foo } = await testHost.compile("test.tsp");
      strictEqual(Foo, blueThing);
    });

    it("can be defined in blockless namespace", async () => {
      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";
  
        namespace MyLibrary;

        @test model Foo { };
  
        @@blue(Foo);
        `,
      );

      const { Foo } = await testHost.compile("test.tsp");
      strictEqual(Foo, blueThing);
    });

    it("can be defined in namespace", async () => {
      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";
  
        namespace MyLibrary {
          @test model Foo { };
          
          @@blue(Foo);
        }
        `,
      );

      const { Foo } = await testHost.compile("test.tsp");
      strictEqual(Foo, blueThing);
    });

    // Regression for https://github.com/microsoft/typespec/issues/2600
    it("alias of instantiated template doesn't interfere with augment decorators", async () => {
      // Here we could have add an issue where `Foo` would have been checked before the `@@blue` augment decorator could be run
      // As we resolve the member symbols and meta types early,
      // alias `FactoryString` would have checked the template instance `Factory<string>`
      // which would then have checked `Foo` and then `@@blue` wouldn't have been run
      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";
  
        @test model Foo {};

        interface Factory<T> {
          op Action(): Foo;
        }

        alias FactoryString = Factory<string>;
        
        op test is FactoryString.Action;

        @@doc(Foo, "This doc");
        @@blue(Foo);
        `,
      );

      const { Foo } = await testHost.compile("test.tsp");
      strictEqual(Foo, blueThing);
    });
  });

  describe("augment types", () => {
    async function expectTarget(code: string, reference: string) {
      let customName: string | undefined;
      let runOnTarget: Type | undefined;

      testHost.addJsFile("test.js", {
        $customName(_: any, t: Type, n: StringLiteral) {
          runOnTarget = t;
          customName = n.value;
        },
      });

      testHost.addTypeSpecFile(
        "test.tsp",
        `
      import "./test.js";

      ${code}

      @@customName(${reference}, "FooCustom");
      `,
      );

      const [result, diagnostics] = await testHost.compileAndDiagnose("test.tsp");
      expectDiagnosticEmpty(diagnostics);
      strictEqual(runOnTarget?.kind, result.target.kind);
      strictEqual(runOnTarget, result.target);
      strictEqual(customName, "FooCustom");
    }

    it("namespace", () => expectTarget(`@test("target") namespace Foo {}`, "Foo"));

    it("global namespace", () => expectTarget(`@@test(global, "target");`, "global"));

    it("model", () => expectTarget(`@test("target") model Foo {}`, "Foo"));
    it("model property", () =>
      expectTarget(
        `model Foo { 
          @test("target") name: string
        }`,
        "Foo.name",
      ));
    it("enum", () => expectTarget(`@test("target") enum Foo { a, b }`, "Foo"));
    it("enum member", () => expectTarget(`enum Foo { @test("target") a, b }`, "Foo.a"));
    it("union", () => expectTarget(`@test("target") union Foo { }`, "Foo"));
    it("union variant", () => expectTarget(`union Foo { @test("target") a: {}, b: {} }`, "Foo.a"));
    it("operation", () => expectTarget(`@test("target") op foo(): string;`, "foo"));
    it("interface", () => expectTarget(`@test("target") interface Foo { }`, "Foo"));
    it("operation in interface", () =>
      expectTarget(`interface Foo { @test("target") list(): void }`, "Foo.list"));
    it("uninstantiated template", async () => {
      testHost.addJsFile("test.js", {
        $customName(_: any, t: Type, n: string) {
          const runOnTarget: Type | undefined = t;
          const customName: string | undefined = n;
          if (runOnTarget) {
          }
          if (customName) {
          }
        },
      });

      testHost.addTypeSpecFile(
        "test.tsp",
        `
          import "./test.js";
  
          model Foo<T> {
            testProp: T;
          };
  
          @test
          op stringTest(): Foo<string>;
  
          @@customName(Foo, "Some foo thing");
          @@customName(Foo.testProp, "Some test prop");
          `,
      );
      const [results, diagnostics] = await testHost.compileAndDiagnose("test.tsp");
      expectDiagnosticEmpty(diagnostics);
      const stringTest = results.stringTest as Operation;
      strictEqual(stringTest.kind, "Operation");
      deepEqual((stringTest.returnType as Model).decorators[0].args[0].value, {
        entityKind: "Type",
        kind: "String",
        value: "Some foo thing",
        isFinished: false,
      });
      for (const prop of (stringTest.returnType as Model).properties) {
        deepEqual(prop[1].decorators[0].args[0].value, {
          entityKind: "Type",
          kind: "String",
          value: "Some test prop",
          isFinished: false,
        });
      }
    });

    it("emit diagnostic if target is instantiated template", async () => {
      testHost.addJsFile("test.js", {
        $customName(_: any, t: Type, n: string) {
          const runOnTarget: Type | undefined = t;
          const customName: string | undefined = n;
          if (runOnTarget) {
          }
          if (customName) {
          }
        },
      });

      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";

        model Foo<T> {
          testProp: T;
        };

        alias StringFoo = Foo<string>;

        @test
        op stringTest(): Foo<string>;

        @@customName(Foo<string>, "A string Foo");
        @@customName(StringFoo, "A string Foo");
        `,
      );
      const diagnostics = await testHost.diagnose("test.tsp");
      strictEqual(diagnostics.length, 2);
      for (const diagnostic of diagnostics) {
        strictEqual(diagnostic.message, "Cannot reference template instances");
      }
    });

    describe("augment location", () => {
      async function expectAugmentTarget(code: string) {
        let customName: string | undefined;
        let runOnTarget: Type | undefined;

        testHost.addJsFile("test.js", {
          $customName(_: any, t: Type, n: StringLiteral) {
            runOnTarget = t;
            customName = n.value;
          },
        });

        testHost.addTypeSpecFile(
          "test.tsp",
          `
            import "./test.js";

            ${code}
      `,
        );

        const { target } = await testHost.compile("test.tsp");
        strictEqual(runOnTarget?.kind, target.kind);
        strictEqual(runOnTarget, target);
        strictEqual(customName, "FooCustom");
      }

      it("augment type in another namespace", async () => {
        await expectAugmentTarget(`
        namespace Lib {
          @test("target") model Foo {}
        }

        namespace MyService {
          @@customName(Lib.Foo, "FooCustom");
        }
      `);
      });

      it("augment type in another file checked before", async () => {
        testHost.addTypeSpecFile("lib.tsp", `@test("target") model Foo {} `);

        await expectAugmentTarget(`
        import "./lib.tsp";
        @@customName(Foo, "FooCustom");
      `);
      });

      it("augment type in another file checked after", async () => {
        testHost.addTypeSpecFile("lib.tsp", `@@customName(Foo, "FooCustom"); `);

        await expectAugmentTarget(`
        import "./lib.tsp";

        @test("target") model Foo {}
      `);
      });
    });

    describe("augment order", () => {
      async function expectAugmentTarget(code: string) {
        let customName: string | undefined;
        let runOnTarget: Type | undefined;

        testHost.addJsFile("test.js", {
          $customName(_: any, t: Type, n: StringLiteral) {
            runOnTarget = t;
            customName = n.value;
          },
        });

        testHost.addTypeSpecFile(
          "test.tsp",
          `
      import "./test.js";

      ${code}
      `,
        );

        const { target } = await testHost.compile("test.tsp");
        strictEqual(runOnTarget?.kind, target.kind);
        strictEqual(runOnTarget, target);
        strictEqual(customName, "FooCustom");
      }

      it("augment decorator should be applied at last", async () => {
        await expectAugmentTarget(`
          @test("target") 
          @customName("Foo")
          model Foo {}
          @@customName(Foo, "FooCustom");
      `);
      });

      it("augment decorator - last win", async () => {
        await expectAugmentTarget(`
          @test("target") 
          @customName("Foo")
          model Foo {}
          @@customName(Foo, "NonCustom");
          @@customName(Foo, "FooCustom");
      `);
      });
    });
  });
});
