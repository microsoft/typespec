import { ok, strictEqual } from "assert";
import { ModelType, UnionType } from "../../core/types.js";
import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("compiler: aliases", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can alias a union expression", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      A: ModelType;
    };

    const propType: UnionType = A.properties.get("prop")!.type as UnionType;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.options.length, 4);
    strictEqual(propType.options[0].kind, "Model");
    strictEqual(propType.options[1].kind, "Model");
    strictEqual(propType.options[2].kind, "String");
    strictEqual(propType.options[3].kind, "Number");
  });

  it("can alias a deep union expression", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      A: ModelType;
    };

    const propType: UnionType = A.properties.get("prop")!.type as UnionType;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.options.length, 5);
    strictEqual(propType.options[0].kind, "Model");
    strictEqual(propType.options[1].kind, "Model");
    strictEqual(propType.options[2].kind, "String");
    strictEqual(propType.options[3].kind, "Number");
    strictEqual(propType.options[4].kind, "String");
  });

  it("can alias a union expression with parameters", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      alias Foo<T> = int32 | T;
      
      @test model A {
        prop: Foo<"hi">
      }
      `
    );

    const { A } = (await testHost.compile("./")) as {
      A: ModelType;
    };

    const propType: UnionType = A.properties.get("prop")!.type as UnionType;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.options.length, 2);
    strictEqual(propType.options[0].kind, "Model");
    strictEqual(propType.options[1].kind, "String");
  });

  it("can alias a deep union expression with parameters", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      alias Foo<T> = int32 | T;
      alias Bar<T, U> = Foo<T> | Foo<U>;
      
      @test model A {
        prop: Bar<"hi", 42>
      }
      `
    );

    const { A } = (await testHost.compile("./")) as {
      A: ModelType;
    };

    const propType: UnionType = A.properties.get("prop")!.type as UnionType;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.options.length, 4);
    strictEqual(propType.options[0].kind, "Model");
    strictEqual(propType.options[1].kind, "String");
    strictEqual(propType.options[2].kind, "Model");
    strictEqual(propType.options[3].kind, "Number");
  });

  it("can alias an intersection expression", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      A: ModelType;
    };

    const propType: ModelType = A.properties.get("prop")!.type as ModelType;
    strictEqual(propType.kind, "Model");
    strictEqual(propType.properties.size, 4);
    ok(propType.properties.has("a"));
    ok(propType.properties.has("b"));
    ok(propType.properties.has("c"));
    ok(propType.properties.has("d"));
  });

  it("can be used like any model", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Test { a: string };

      alias Alias = Test;
      
      @test model A extends Alias { };
      @test model B { ... Alias };
      @test model C { c: Alias };
      `
    );
    const { Test, A, B, C } = (await testHost.compile("./")) as {
      Test: ModelType;
      A: ModelType;
      B: ModelType;
      C: ModelType;
    };

    strictEqual(A.baseModel, Test);
    ok(B.properties.has("a"));
    strictEqual(C.properties.get("c")!.type, Test);
  });

  it("can be used like any namespace", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace Foo {
        @test model Bar { }
      }

      alias AliasFoo = Foo;

      @test model Baz { x: AliasFoo.Bar };
      `
    );

    const { Bar, Baz } = (await testHost.compile("./")) as {
      Bar: ModelType;
      Baz: ModelType;
    };

    strictEqual(Baz.properties.get("x")!.type, Bar);
  });

  it("emit diagnostics if assign itself", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      alias A = A;
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit single diagnostics if assign itself as generic and is referenced", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      alias A<T> = A<T>;

      model Foo {a: A<string>}
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit diagnostics if reference itself", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      alias A = "string" | A;
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });
});
