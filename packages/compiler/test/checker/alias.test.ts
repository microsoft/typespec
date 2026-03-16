import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Model, Type, Union } from "../../src/core/types.js";
import { expectDiagnosticEmpty, expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: aliases", () => {
  function getOptionAtIndex(union: Union, index: number): Type {
    return [...union.variants.values()][index].type;
  }
  it("can alias a union expression", async () => {
    const { A } = await Tester.compile(t.code`
      alias Foo = int32 | string;
      alias Bar = "hi" | 10;
      alias FooBar = Foo | Bar;
      
      model ${t.model("A")} {
        prop: FooBar
      }
    `);

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 4);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 2).kind, "String");
    strictEqual(getOptionAtIndex(propType, 3).kind, "Number");
  });

  it("can alias a deep union expression", async () => {
    const { A } = await Tester.compile(t.code`
      alias Foo = int32 | string;
      alias Bar = "hi" | 10;
      alias Baz = Foo | Bar;
      alias FooBar = Baz | "bye";
      
      model ${t.model("A")} {
        prop: FooBar
      }
    `);

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
    const { A } = await Tester.compile(t.code`
      alias Foo<TEST> = int32 | TEST;
      
      model ${t.model("A")} {
        prop: Foo<"hi">
      }
    `);

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 2);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "String");
  });

  it("can alias a deep union expression with parameters", async () => {
    const { A } = await Tester.compile(t.code`
      alias Foo<T> = int32 | T;
      alias Bar<T, U> = Foo<T> | Foo<U>;
      
      model ${t.model("A")} {
        prop: Bar<"hi", 42>
      }
    `);

    const propType: Union = A.properties.get("prop")!.type as Union;
    strictEqual(propType.kind, "Union");
    strictEqual(propType.variants.size, 4);
    strictEqual(getOptionAtIndex(propType, 0).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 1).kind, "String");
    strictEqual(getOptionAtIndex(propType, 2).kind, "Scalar");
    strictEqual(getOptionAtIndex(propType, 3).kind, "Number");
  });

  it("can alias an intersection expression", async () => {
    const { A } = await Tester.compile(t.code`
      alias Foo = {a: string} & {b: string};
      alias Bar = {c: string} & {d: string};
      alias FooBar = Foo & Bar;
      
      model ${t.model("A")} {
        prop: FooBar
      }
    `);

    const propType: Model = A.properties.get("prop")!.type as Model;
    strictEqual(propType.kind, "Model");
    strictEqual(propType.properties.size, 4);
    ok(propType.properties.has("a"));
    ok(propType.properties.has("b"));
    ok(propType.properties.has("c"));
    ok(propType.properties.has("d"));
  });

  it("can be used like any model", async () => {
    const { Test, A, B, C } = await Tester.compile(t.code`
      model ${t.model("Test")} { a: string };

      alias Alias = Test;
      
      model ${t.model("A")} extends Alias { };
      model ${t.model("B")} { ... Alias };
      model ${t.model("C")} { c: Alias };
    `);

    strictEqual(A.baseModel, Test);
    ok(B.properties.has("a"));
    strictEqual(C.properties.get("c")!.type, Test);
  });

  it("can be used like any namespace", async () => {
    const { Bar, Baz } = await Tester.compile(t.code`
      namespace Foo {
        model ${t.model("Bar")} { }
      }

      alias AliasFoo = Foo;

      model ${t.model("Baz")} { x: AliasFoo.Bar };
    `);

    strictEqual(Baz.properties.get("x")!.type, Bar);
  });

  it("model expression defined in alias use containing namespace", async () => {
    const { Test, Foo } = await Tester.compile(t.code`
      namespace ${t.namespace("Foo")} {
        alias B = {a: string};
      }
      model ${t.model("Test")} {
        prop: Foo.B;
      }
    `);

    const expr = Test.properties.get("prop")!.type as Model;
    strictEqual(expr.namespace, Foo);
  });

  it("emit diagnostics if assign itself", async () => {
    const diagnostics = await Tester.diagnose(`
      alias A = A;
    `);
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit single diagnostics if assign itself as generic and is referenced", async () => {
    const diagnostics = await Tester.diagnose(`
      alias A<T> = A<T>;

      model Foo {a: A<string>}
    `);
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  it("emit diagnostics if reference itself", async () => {
    const diagnostics = await Tester.diagnose(`
      alias A = "string" | A;
    `);
    expectDiagnostics(diagnostics, {
      code: "circular-alias-type",
      message: "Alias type 'A' recursively references itself.",
    });
  });

  // REGRESSION TEST: https://github.com/Azure/typespec-azure/issues/3365
  it("alias an namespace in JS file shouldn't crash", async () => {
    const diagnostics = await Tester.files({
      "lib.js": mockFile.js({
        namespace: "Foo.Bar",
        $foo: () => {},
      }),
    }).import("./lib.js").diagnose(`
        namespace Foo.Bar { op abc(): void;}

        alias Aliased = Foo.Bar;
        op getSmurf is Aliased.abc;
      `);
    expectDiagnosticEmpty(diagnostics);
  });

  // REGRESSION TEST: https://github.com/microsoft/typespec/issues/3125
  it("trying to access member of aliased union expression shouldn't crash", async () => {
    const diagnostics = await Tester.diagnose(`
      alias A = {foo: string} | {bar: string};

      alias Aliased = A.prop;
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: `Cannot resolve 'prop' in node AliasStatement since it has no members. Did you mean to use "::" instead of "."?`,
    });
  });
  it("trying to access unknown member of aliased model expression shouldn't crash", async () => {
    const diagnostics = await Tester.diagnose(`
      alias A = {foo: string};

      alias Aliased = A.prop;
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: `Model doesn't have member prop`,
    });
  });
});
