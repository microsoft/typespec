import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { StringLiteral, Type } from "../../src/core/types.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

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
    ok(result.target, `Missing element decorated with '@test("target")'`);
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
  it("property in alias of model expression", () =>
    expectTarget(
      `alias Foo = { 
          @test("target") name: string
        };`,
      "Foo.name",
    ));
  it("property from spread of alias", () =>
    expectTarget(
      `alias Spread = { 
          @test("target") name: string
        };
       model Foo {
          ...Spread,
       }`,
      "Foo.name",
    ));
  it("property from spread of alias in alias expression", () =>
    expectTarget(
      `alias Spread = { 
          @test("target") name: string
        };
       alias Foo = {
          ...Spread,
       };`,
      "Foo.name",
    ));

  it("property from model is", () =>
    expectTarget(
      `model Base { 
        @test("target") name: string
      };
      model Foo is Base;`,
      "Foo.name",
    ));

  it("property of nested model expression", () =>
    expectTarget(
      `model Foo { 
        nested: {
          @test("target") name: string
        }
      }`,
      "Foo.nested::type.name",
    ));
  it("property of multiple nested model expression", () =>
    expectTarget(
      `model Foo { 
        nested: {
           nestedAgain: {
            @test("target") name: string
          }
        }
      }`,
      "Foo.nested::type.nestedAgain::type.name",
    ));

  it("enum", () => expectTarget(`@test("target") enum Foo { a, b }`, "Foo"));
  it("enum member", () => expectTarget(`enum Foo { @test("target") a, b }`, "Foo.a"));
  it("union", () => expectTarget(`@test("target") union Foo { }`, "Foo"));
  it("union variant", () => expectTarget(`union Foo { @test("target") a: {}, b: {} }`, "Foo.a"));
  it("operation", () => expectTarget(`@test("target") op foo(): string;`, "foo"));
  it("interface", () => expectTarget(`@test("target") interface Foo { }`, "Foo"));
  it("operation in interface", () =>
    expectTarget(`interface Foo { @test("target") list(): void }`, "Foo.list"));
  it("operation parameter", () =>
    expectTarget(`op foo(@test("target") bar: string): string;`, "foo::parameters.bar"));
  it("operation parameter nested model expression", () =>
    expectTarget(
      `op foo(nested: { @test("target") bar: string }): string;`,
      "foo::parameters.nested::type.bar",
    ));

  describe("uninstantiated template", () => {
    it("model", () =>
      expectTarget(
        `
          @test("target") model Foo<T> { testProp: T }

          model Insantiate { foo: Foo<string> }
        `,
        "Foo",
      ));

    it("model property", () =>
      expectTarget(
        `
          model Foo<T> { @test("target") testProp: T }

          model Insantiate { foo: Foo<string> }
        `,
        "Foo.testProp",
      ));

    it("via alias", () =>
      expectTarget(
        `
            @test("target") model Foo<T> { testProp: T }
  
            alias FooAlias<T> = Foo<T>;
  
            model Insantiate { foo: FooAlias<string> }
          `,
        "FooAlias",
      ));
  });
});

describe("emit diagnostic", () => {
  function diagnose(code: string) {
    testHost.addJsFile("test.js", {
      $customName(_: any, t: Type, n: string) {},
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
          import "./test.js";
          ${code}
        `,
    );
    return testHost.diagnose("test.tsp");
  }

  it("if using unknown decorator", async () => {
    testHost.addTypeSpecFile(
      "test.tsp",
      `
        import "./test.js";
       
        `,
    );
    const diagnostics = await diagnose(`
       model Foo {}
       @@notDefined(Foo, "A string Foo");
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown decorator @notDefined",
    });
  });

  it("if target is invalid identifier", async () => {
    const diagnostics = await diagnose(`@@customName(Foo, "A string Foo");`);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier Foo",
    });
  });

  it("if target is invalid member expression", async () => {
    const diagnostics = await diagnose(`@@customName(Foo.prop, "A string Foo");`);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier Foo",
    });
  });

  it("if target is missing member", async () => {
    const diagnostics = await diagnose(`model Foo{} @@customName(Foo.prop, "A string Foo");`);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Model doesn't have member prop",
    });
  });

  it("emit diagnostic if target is instantiated template", async () => {
    const diagnostics = await diagnose(`
      model Foo<T> { prop: T }
      @@customName(Foo<string>, "A string Foo");  
    `);
    expectDiagnostics(diagnostics, {
      code: "augment-decorator-target",
      message: "Cannot reference template instances",
    });
  });

  it("emit diagnostic if target is instantiated template via alias", async () => {
    const diagnostics = await diagnose(`
      model Foo<T> { prop: T }
      alias StringFoo = Foo<string>;

      @@customName(StringFoo, "A string Foo");  
    `);
    expectDiagnostics(diagnostics, {
      code: "augment-decorator-target",
      message: "Cannot reference template instances",
    });
  });

  it("emit diagnostic if target is instantiated template member", async () => {
    const diagnostics = await diagnose(`
      interface Foo { test<T>(): T }

      @@customName(Foo.test<string>, "A string Foo");  
    `);
    expectDiagnostics(diagnostics, {
      code: "augment-decorator-target",
      message: "Cannot reference template instances",
    });
  });

  it("emit diagnostic if target is instantiated template member container", async () => {
    const diagnostics = await diagnose(`
      interface Foo<T> { test(): T }
      alias FooString = Foo<string>;
      @@customName(FooString.test, "A string Foo");  
    `);
    expectDiagnostics(diagnostics, {
      code: "augment-decorator-target",
      message: "Cannot reference template instances",
    });
  });

  it("emit diagnostic if target is instantiated template via metatype", async () => {
    const diagnostics = await diagnose(`
      model Foo<T> { prop: T }
      op test(): Foo<string>;

      @@customName(test::returnType, "A string Foo");  
    `);
    expectDiagnostics(diagnostics, {
      code: "augment-decorator-target",
      message: "Cannot reference template instances",
    });
  });
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
