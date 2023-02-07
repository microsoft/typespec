import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { isArrayModelType, Operation } from "../../core/index.js";
import { isTemplateDeclaration } from "../../core/type-utils.js";
import { Model, ModelProperty, Type } from "../../core/types.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
  TestHost,
} from "../../testing/index.js";

describe("compiler: models", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("allow template parameters passed into decorators", async () => {
    let t1, t2;

    testHost.addJsFile("dec.js", {
      $myDec(p: any, t: any, _t1: Model, _t2: Model) {
        t1 = _t1;
        t2 = _t2;
      },
    });

    testHost.addCadlFile(
      "main.cadl",
      `
      import "./dec.js";
      model B { }
      model C { }
      @myDec(T1, T2)
      model A<T1,T2> {

      }
      `
    );

    const { B, C } = (await testHost.compile("./")) as {
      B: Model;
      C: Model;
    };

    strictEqual(t1, B);
    strictEqual(t2, C);
  });

  it("doesn't allow duplicate properties", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model A { x: int32; x: int32; }
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Model already has a property/);
  });

  it("doesn't invoke decorators on uninstantiated templates", async () => {
    const blues = new WeakSet();
    let calls = 0;
    testHost.addJsFile("dec.js", {
      $blue(p: any, t: Type) {
        calls++;
        blues.add(t);
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./dec.js";
      @blue model A<T> { @blue x: int32}
      `
    );
    await testHost.compile("./");
    strictEqual(calls, 0);
  });

  it("emit single error when there is an invalid ref in a templated type", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
        model A<T> {t: T, invalid: notValidType }

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, [
      {
        code: "unknown-identifier",
        message: "Unknown identifier notValidType",
      },
    ]);
  });

  describe("assign default values", () => {
    const testCases: [string, string, any][] = [
      ["boolean", `false`, { kind: "Boolean", value: false }],
      ["boolean", `true`, { kind: "Boolean", value: true }],
      ["string", `"foo"`, { kind: "String", value: "foo" }],
      ["int32", `123`, { kind: "Number", value: 123 }],
    ];

    for (const [type, defaultValue, expectedValue] of testCases) {
      it(`foo?: ${type} = ${defaultValue}`, async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
          model A { @test foo?: ${type} = ${defaultValue} }
          `
        );
        const { foo } = (await testHost.compile("main.cadl")) as { foo: ModelProperty };
        deepStrictEqual({ ...foo.default }, expectedValue);
      });
    }
  });

  describe("doesn't allow a default of different type than the property type", () => {
    const testCases: [string, string, string][] = [
      ["string", "123", "Type '123' is not assignable to type 'Cadl.string'"],
      ["int32", `"foo"`, "Type 'foo' is not assignable to type 'Cadl.int32'"],
      ["boolean", `"foo"`, "Type 'foo' is not assignable to type 'Cadl.boolean'"],
      ["string[]", `["foo", 123]`, `Type '123' is not assignable to type 'Cadl.string'`],
      [`"foo" | "bar"`, `"foo1"`, "Type 'foo1' is not assignable to type 'foo | bar'"],
    ];

    for (const [type, defaultValue, errorMessage] of testCases) {
      it(`foo?: ${type} = ${defaultValue}`, async () => {
        testHost.addCadlFile(
          "main.cadl",
          `
          model A { foo?: ${type} = ${defaultValue} }
          `
        );
        const diagnostics = await testHost.diagnose("main.cadl");
        expectDiagnostics(diagnostics, {
          code: "unassignable",
          message: errorMessage,
        });
      });
    }
  });

  it(`doesn't emit unsupported-default diagnostic when type is an error`, async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
        model A { foo?: bool = false }
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, [
      { code: "unknown-identifier", message: "Unknown identifier bool" },
    ]);
  });

  describe("link model with its properties", () => {
    it("provides parent model of properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test
        model A {
          pA: int32;
        }
  
        @test
        model B {
          pB: int32;
  
        }
        `
      );

      const { A, B } = (await testHost.compile("./")) as { A: Model; B: Model };

      strictEqual(A.properties.get("pA")?.model, A);
      strictEqual(B.properties.get("pB")?.model, B);
    });

    it("property merged via intersection", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model A {
        a: string;
      }
      model B {
        b: string;
      }

      @test model Test {prop: A & B}
      `
      );
      const { Test } = (await testHost.compile("main.cadl")) as { Test: Model };
      const AB = Test.properties.get("prop")?.type;

      strictEqual(AB?.kind, "Model" as const);
      strictEqual(AB.properties.get("a")?.model, AB);
      strictEqual(AB.properties.get("b")?.model, AB);
    });

    it("property copied via spread", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Foo {
        prop: string;
      }

      @test model Test {...Foo}
      `
      );
      const { Test } = (await testHost.compile("main.cadl")) as { Test: Model };
      strictEqual(Test.properties.get("prop")?.model, Test);
    });

    it("property copied via `is`", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
      model Foo {
        prop: string;
      }

      @test model Test is Foo;
      `
      );
      const { Test } = (await testHost.compile("main.cadl")) as { Test: Model };
      strictEqual(Test.properties.get("prop")?.model, Test);
    });
  });

  describe("with extends", () => {
    it("allow subtype to override parent property if subtype is assignable to parent type", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int32 }
        model B extends A { x: int16 };

        model Car { kind: string };
        model Ford extends Car { kind: "Ford" };
        `
      );
      await testHost.compile("main.cadl");
    });

    it("disallow subtype overriding parent property if subtype is not assignable to parent type", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int16 }
        model B extends A { x: int32 };

        model Car { kind: string };
        model Ford extends Car { kind: int32 };
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named x of type Cadl.int32 which cannot override type Cadl.int16",
        },
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named kind of type Cadl.int32 which cannot override type Cadl.string",
        },
      ]);
    });

    it("disallow subtype overriding parent property if parent property type is not intrinsic", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model Named {
          name: string;
        }

        model A { x: Named }
        model B extends A { x: {name: "B"} };

        model C { kind: "C" }
        model D extends C { kind: "D"}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-intrinsic",
          message:
            "Model has an inherited property named x of type (anonymous model) which can only override an intrinsic type on the parent property, not Named",
        },
        {
          code: "override-property-intrinsic",
          message:
            "Model has an inherited property named kind of type D which can only override an intrinsic type on the parent property, not C",
        },
      ]);
    });

    it("allow multiple overrides", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int64 };
        model B extends A { x: int32 };
        model C extends B { x: int16 };
        `
      );
      await testHost.compile("main.cadl");
    });

    it("ensure subtype overriding is not shadowed", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int64 };
        model B extends A { x: int16 };
        model C extends B { x: int32 };
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named x of type Cadl.int32 which cannot override type Cadl.int16",
        },
      ]);
    });

    it("removes decorators not specified on derived type that are on the base type", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model Base { @doc("Base") h: string;}
        @test model Widget extends Base { h: "test";}
        `
      );
      const { Widget } = (await testHost.compile("main.cadl")) as { Widget: Model };
      strictEqual(Widget.decorators.length, 1);
      strictEqual((Widget.properties.get("h")!.type as any)!.value, "test");
    });

    it("allow intersection of model with overridden property", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model Base {prop: string;}
        model Widget extends Base {prop: "test";}
        @test op foo(): Widget & {};
        `
      );
      const { foo } = (await testHost.compile("main.cadl")) as { foo: Operation };
      strictEqual(((foo.returnType as Model).properties.get("prop")!.type as any)!.value, "test");
    });

    it("allow spreading of model with overridden property", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model Base {h1: string}
        model Widget extends Base {h1: "test"}
        @test model Spread {...Widget}
        `
      );
      const { Spread } = (await testHost.compile("main.cadl")) as { Spread: Model };
      strictEqual((Spread.properties.get("h1")!.type as any)!.value, "test");
    });

    it("keeps reference of children", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test model Pet {
          name: true;
        }

        @test model Cat extends Pet {
          meow: true;
        }

        @test model Dog extends Pet {
          bark: true;
        }
        `
      );
      const { Pet, Dog, Cat } = (await testHost.compile("main.cadl")) as {
        Pet: Model;
        Dog: Model;
        Cat: Model;
      };
      ok(Pet.derivedModels);
      strictEqual(Pet.derivedModels.length, 2);
      strictEqual(Pet.derivedModels[0], Cat);
      strictEqual(Pet.derivedModels[1], Dog);
    });

    it("keeps reference of children with templates", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        @test model Pet {
          name: true;
        }

        model TPet<T> extends Pet {
          t: T;
        }

        @test model Cat is TPet<string> {
          meow: true;
        }

        @test model Dog is TPet<string> {
          bark: true;
        }
        `
      );
      const { Pet, Dog, Cat } = (await testHost.compile("main.cadl")) as {
        Pet: Model;
        Dog: Model;
        Cat: Model;
      };
      strictEqual(Pet.derivedModels.length, 4);
      strictEqual(Pet.derivedModels[0].name, "TPet");
      ok(isTemplateDeclaration(Pet.derivedModels[0]));

      strictEqual(Pet.derivedModels[1].name, "TPet");
      ok(Pet.derivedModels[1].templateMapper?.args);
      strictEqual(Pet.derivedModels[1].templateMapper?.args[0].kind, "Scalar");
      strictEqual((Pet.derivedModels[1].templateMapper?.args[0] as Model).name, "string");

      strictEqual(Pet.derivedModels[2], Cat);
      strictEqual(Pet.derivedModels[3], Dog);
    });

    it("emit error when extends non model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A extends (string | int32) {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models must extend other models.",
      });
    });

    it("emit error when extend model expression", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A extends {name: string} {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extend model expression via alias", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        alias B = {name: string};
        model A extends B {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extends itself", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A extends A {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when extends circular reference", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A extends B {}
        model B extends A {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit no error when extends has property to base model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A extends B {}
        model B {
          a: A
        }
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("with is", () => {
    let testHost: TestHost;
    const blues = new WeakSet();
    const reds = new WeakSet();
    beforeEach(async () => {
      testHost = await createTestHost();
      testHost.addJsFile("dec.js", {
        $blue(p: any, t: Type) {
          blues.add(t);
        },
        $red(p: any, t: Type) {
          reds.add(t);
        },
      });
    });

    it("copies decorators", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @blue model A { }
        @test @red model B is A { };
        `
      );
      const { B } = (await testHost.compile("main.cadl")) as { B: Model };
      ok(blues.has(B));
      ok(reds.has(B));
    });

    it("copies properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int32 }
        @test model B is A { y: string };
        `
      );
      const { B } = (await testHost.compile("main.cadl")) as { B: Model };
      ok(B.properties.has("x"));
      ok(B.properties.has("y"));
    });

    it("copies heritage", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @test model A { x: int32 }
        model B extends A { y: string };
        @test model C is B { }
        `
      );
      const { A, C } = (await testHost.compile("main.cadl")) as { A: Model; C: Model };
      strictEqual(C.baseModel, A);
      strictEqual(A.derivedModels[1], C);
    });

    it("model is accept array expression", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @test model A is string[];
        `
      );
      const { A } = (await testHost.compile("main.cadl")) as { A: Model };
      ok(isArrayModelType(testHost.program, A));
    });

    it("model is accept array expression of complex type", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @test model A is (string | int32)[];
        `
      );
      const { A } = (await testHost.compile("main.cadl")) as { A: Model };
      ok(isArrayModelType(testHost.program, A));
      strictEqual(A.indexer.value.kind, "Union");
    });

    it("doesn't allow duplicate properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        model A { x: int32 }
        model B is A { x: int32 };
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      match(diagnostics[0].message, /Model already has a property/);
    });

    it("emit error when is non model or array", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is (string | int32) {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` must specify another model.",
      });
    });

    it("emit error when is model expression", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is {name: string} {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is model expression via alias", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        alias B = {name: string};
        model A is B {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is itself", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is A {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit single error when is itself as a templated with multiple instantiations", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A<T> is A<T> {}

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnostics(diagnostics, [
        {
          code: "circular-base-type",
          message: "Type 'A' recursively references itself as a base type.",
        },
      ]);
    });

    it("emit error when 'is' has circular reference", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is B {}
        model B is A {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when 'is' circular reference via extends", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is B {}
        model B extends A {}
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit no error when extends has property to base model", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A is B {}
        model B {
          a: A
        }
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      expectDiagnosticEmpty(diagnostics);
    });

    it("resolve recursive template types", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A<T> {
          c: T;
          b: B
        }
        @test
        model B is A<string> {}
        @test
        model C is A<int32> {}
        `
      );
      const { B, C } = await testHost.compile("main.cadl");
      strictEqual((B as Model).properties.size, 2);
      strictEqual(((B as Model).properties.get("c")?.type as any).name, "string");
      strictEqual(((B as Model).properties.get("b")?.type as any).name, "B");

      strictEqual((C as Model).properties.size, 2);
      strictEqual(((C as Model).properties.get("c")?.type as any).name, "int32");
      strictEqual(((C as Model).properties.get("b")?.type as any).name, "B");
    });
  });
});
