import { ok, strictEqual } from "assert";
import { Model, Type, Union } from "../../src/core/types.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: aliases", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function getOptionAtIndex(union: Union, index: number): Type {
    return [...union.variants.values()][index].type;
  }
  it("can alias a union expression", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias Foo = int32 | string;
      alias Bar = "hi" | 10;
      alias FooBar = Foo | Bar;
      
      @test model A {
        prop: FooBar
      }
      `
    );
    const { A } = (await testHost.compile("./")) as {
      A: Model;
    };

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 4);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 2).kind, "String");
    strictEqual(getOptionAtIndex(propType, 3).kind, "Number");
  });

  it("can alias a deep union expression", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias Foo = int32 | string;
      alias Bar = "hi" | 10;
      alias Baz = Foo | Bar;
      alias FooBar = Baz | "bye";
      
      @test model A {
        prop: FooBar
      }
      `
    );
    const { A } = (await testHost.compile("./")) as {
      A: Model;
    };

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 5);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 2).kind, "String");
    strictEqual(getOptionAtIndex(propType, 3).kind, "Number");
    strictEqual(getOptionAtIndex(propType, 4).kind, "String");
  });

  it("can alias a union expression with parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias Foo<TEST> = int32 | TEST;
      
      @test model A {
        prop: Foo<"hi">
      }
      `
    );

    const { A } = (await testHost.compile("./")) as {
      A: Model;
    };

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 2);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "String");
  });

  it("can alias a deep union expression with parameters", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias Foo<T> = int32 | T;
      alias Bar<T, U> = Foo<T> | Foo<U>;
      
      @test model A {
        prop: Bar<"hi", 42>
      }
      `
    );

    const { A } = (await testHost.compile("./")) as {
      A: Model;
    };

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 4);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "String");
    strictEqual(getOptionAtIndex(propType, 2).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 3).kind, "Number");
  });

  it("can alias an intersection expression", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias Foo = {a: string} & {b: string};
      alias Bar = {c: string} & {d: string};
      alias FooBar = Foo & Bar;
      
      @test model A {
        prop: FooBar
      }
      `
    );
    const { A } = (await testHost.compile("./")) as {
      A: Model;
    };

    const propType: Model = A.properties.get("prop")!.type as Model;
    strictEqual(propType.kind, "Model");
    strictEqual(propType.properties.size, 4);
    ok(propType.properties.has("a"));
    ok(propType.properties.has("b"));
    ok(propType.properties.has("c"));
    ok(propType.properties.has("d"));
  });

  it("can be used like any model", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Test { a: string };

      alias Alias = Test;
      
      @test model A extends Alias { };
      @test model B { ... Alias };
      @test model C { c: Alias };
      `
    );
    const { Test, A, B, C } = (await testHost.compile("./")) as {
      Test: Model;
      A: Model;
      B: Model;
      C: Model;
    };

    strictEqual(A.baseModel, Test);
    ok(B.properties.has("a"));
    strictEqual(C.properties.get("c")!.type, Test);
  });

  it("can be used like any namespace", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      namespace Foo {
        @test model Bar { }
      }

      alias AliasFoo = Foo;

      @test model Baz { x: AliasFoo.Bar };
      `
    );

    const { Bar, Baz } = (await testHost.compile("./")) as {
      Bar: Model;
      Baz: Model;
    };

    strictEqual(Baz.properties.get("x")!.type, Bar);
  });

  it("emit diagnostics if assign itself", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias A = A;
      `
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit single diagnostics if assign itself as generic and is referenced", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias A<T> = A<T>;

      model Foo {a: A<string>}
      `
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit diagnostics if reference itself", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      alias A = "string" | A;
      `
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  // REGRESSION TEST: https://github.com/Azure/typespec-azure/issues/3365
  it("alias an namespace in JS file shouldn't crash", async () => {
    testHost.addJsFile("lib.js", {
      namespace: "Foo.Bar",
      $foo: () => {},
    });
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./lib.js";
      namespace Foo.Bar { op abc(): void;}

      alias Aliased = Foo.Bar;
      op getSmurf is Aliased.abc;

      `
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });
});
