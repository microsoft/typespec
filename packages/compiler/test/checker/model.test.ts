import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import { isTemplateDeclaration } from "../../src/core/type-utils.js";
import { Model, ModelProperty, Type } from "../../src/core/types.js";
import {
  Numeric,
  Operation,
  getDoc,
  isArrayModelType,
  isRecordModelType,
} from "../../src/index.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../src/testing/index.js";

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

    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./dec.js";
      model B { }
      model C { }
      @myDec(T1, T2)
      model A<T1,T2> {

      }
      `,
    );

    const { B, C } = (await testHost.compile("./")) as {
      B: Model;
      C: Model;
    };

    strictEqual(t1, B);
    strictEqual(t2, C);
  });

  it("doesn't allow duplicate properties", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model A { x: int32; x: int32; }
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
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
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./dec.js";
      @blue model A<T> { @blue x: int32}
      `,
    );
    await testHost.compile("./");
    strictEqual(calls, 0);
  });

  it("emit single error when there is an invalid ref in a templated type", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A<T> {t: T, invalid: notValidType }

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unknown-identifier",
        message: "Unknown identifier notValidType",
      },
    ]);
  });

  describe("property defaults", () => {
    describe("set defaultValue", () => {
      const testCases: [string, string, { kind: string; value: any }][] = [
        ["boolean", `false`, { kind: "BooleanValue", value: false }],
        ["boolean", `true`, { kind: "BooleanValue", value: true }],
        ["string", `"foo"`, { kind: "StringValue", value: "foo" }],
        ["int32", `123`, { kind: "NumericValue", value: Numeric("123") }],
        ["int32 | null", `null`, { kind: "NullValue", value: null }],
      ];

      it.each(testCases)(`foo?: %s = %s`, async (type, defaultValue, expectedValue) => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          model A { @test foo?: ${type} = ${defaultValue} }
          `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, expectedValue.kind);
        expect((foo.defaultValue as any).value).toMatchObject(expectedValue.value);
      });

      it(`foo?: string[] = #["abc"]`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: string[] = #["abc"] }
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "ArrayValue");
      });

      it(`foo?: {name: string} = #{name: "abc"}`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: {name: string} = #{name: "abc"} }
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "ObjectValue");
      });

      it(`assign scalar for primitive types if not yet`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        const a = 123;
        model A { @test foo?: int32 = a }
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "NumericValue");
        strictEqual(foo.defaultValue.scalar?.kind, "Scalar");
        strictEqual(foo.defaultValue.scalar?.name, "int32");
      });

      it(`foo?: Enum = Enum.up`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: TestEnum = TestEnum.up }
        enum TestEnum {up, down}
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "EnumValue");
        deepStrictEqual(foo.defaultValue?.value.kind, "EnumMember");
        deepStrictEqual(foo.defaultValue?.value.name, "up");
      });

      it(`foo?: Union = Union.up`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: Direction = Direction.up }
        union Direction {up: "up-value", down: "down-value"}
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "StringValue");
        deepStrictEqual(foo.defaultValue?.value, "up-value");
      });
    });

    describe("set deprecated default property", () => {
      const testCases: [string, string, any][] = [
        ["boolean", `false`, { kind: "Boolean", value: false, isFinished: false }],
        ["boolean", `true`, { kind: "Boolean", value: true, isFinished: false }],
        ["string", `"foo"`, { kind: "String", value: "foo", isFinished: false }],
        ["int32", `123`, { kind: "Number", value: 123, valueAsString: "123", isFinished: false }],
        ["int32 | null", `null`, { kind: "Intrinsic", name: "null", isFinished: false }],
      ];

      it.each(testCases)(`foo?: %s = %s`, async (type, defaultValue, expectedValue) => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          model A { @test foo?: ${type} = ${defaultValue} }
          `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        expect({ ...foo.default }).toMatchObject(expectedValue);
      });

      it(`foo?: string[] = #["abc"] result is not set`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: string[] = #["abc"] }
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        deepStrictEqual(foo.default, undefined);
      });

      it(`foo?: {name: string} = #{name: "abc"} result is not set`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A { @test foo?: {name: string} = #{name: "abc"} }
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        deepStrictEqual(foo.default, undefined);
      });
    });
  });

  describe("doesn't allow a default of different type than the property type", () => {
    const testCases: [string, string, string][] = [
      ["string", "123", "Type '123' is not assignable to type 'string'"],
      ["int32", `"foo"`, `Type '"foo"' is not assignable to type 'int32'`],
      ["boolean", `"foo"`, `Type '"foo"' is not assignable to type 'boolean'`],
      ["string[]", `#["foo", 123]`, `Type '123' is not assignable to type 'string'`],
      [`"foo" | "bar"`, `"foo1"`, `Type '"foo1"' is not assignable to type '"foo" | "bar"'`],
    ];

    for (const [type, defaultValue, errorMessage] of testCases) {
      it(`foo?: ${type} = ${defaultValue}`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
          model A { foo?: ${type} = ${defaultValue} }
          `,
        );
        const diagnostics = await testHost.diagnose("main.tsp");
        expectDiagnostics(diagnostics, {
          code: "unassignable",
          message: errorMessage,
        });
      });
    }
  });

  it(`emit diagnostic when using non value type as default value`, async () => {
    const { source, pos } = extractCursor(`
    model Foo<D> {
      prop?: string = ┆D;
    }
    `);
    testHost.addTypeSpecFile("main.tsp", source);
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "D refers to a type, but is being used as a value here.",
      pos,
    });
  });

  it(`doesn't emit additional diagnostic when type is an error`, async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
        model A { foo?: bool = false }
      `,
    );
    const diagnostics = await testHost.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      { code: "unknown-identifier", message: "Unknown identifier bool" },
    ]);
  });

  describe("link model with its properties", () => {
    it("provides parent model of properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test
        model A {
          pA: int32;
        }
  
        @test
        model B {
          pB: int32;
  
        }
        `,
      );

      const { A, B } = (await testHost.compile("./")) as { A: Model; B: Model };

      strictEqual(A.properties.get("pA")?.model, A);
      strictEqual(B.properties.get("pB")?.model, B);
    });

    it("property merged via intersection", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
      model A {
        a: string;
      }
      model B {
        b: string;
      }

      @test model Test {prop: A & B}
      `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as { Test: Model };
      const AB = Test.properties.get("prop")?.type;

      strictEqual(AB?.kind, "Model" as const);
      strictEqual(AB.properties.get("a")?.model, AB);
      strictEqual(AB.properties.get("b")?.model, AB);
    });

    it("property copied via spread", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
      model Foo {
        prop: string;
      }

      @test model Test {...Foo}
      `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as { Test: Model };
      strictEqual(Test.properties.get("prop")?.model, Test);
    });

    it("property copied via `is`", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
      model Foo {
        prop: string;
      }

      @test model Test is Foo;
      `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as { Test: Model };
      strictEqual(Test.properties.get("prop")?.model, Test);
    });
  });

  describe("with extends", () => {
    it("allow subtype to override parent property if subtype is assignable to parent type", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int32 }
        model B extends A { x: int16 };

        model Car { kind: string };
        model Ford extends Car { kind: "Ford" };
        `,
      );
      await testHost.compile("main.tsp");
    });

    it("alllow subtype overriding of union", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: 1 | 2 | 3 }
        model B extends A { x: 2 };

        model Car { kind: "Ford" | "Toyota" };
        model Ford extends Car { kind: "Ford" };
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnosticEmpty(diagnostics);
    });

    it("alllow subtype overriding of Record", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Named {
          name: string;
        }

        model A { x: Named }
        model B extends A { x: {name: "B"} };
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnosticEmpty(diagnostics);
    });

    it("disallow subtype overriding parent property if subtype is not assignable to parent type", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int16 }
        model B extends A { x: int32 };

        model Car { kind: string };
        model Ford extends Car { kind: int32 };
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named x of type int32 which cannot override type int16",
        },
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named kind of type int32 which cannot override type string",
        },
      ]);
    });

    it("disallows subtype overriding required parent property with optional property", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int32; }
        model B extends A { x?: int32; }
        `,
      );

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          severity: "error",
          message:
            "Model has a required inherited property named x which cannot be overridden as optional",
        },
      ]);
    });

    it("disallows subtype overriding required parent property with optional through multiple levels of inheritance", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int32; }
        model B extends A { }
        model C extends B { x?: int16; }
        `,
      );

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          severity: "error",
          message:
            "Model has a required inherited property named x which cannot be overridden as optional",
        },
      ]);
    });

    it("shows both errors when an override is optional and not assignable", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int32; }
        model B extends A { x?: string; }
        `,
      );

      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          severity: "error",
          message:
            "Model has an inherited property named x of type string which cannot override type int32",
        },
        {
          code: "override-property-mismatch",
          severity: "error",
          message:
            "Model has a required inherited property named x which cannot be overridden as optional",
        },
      ]);
    });

    it("allow multiple overrides", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int64 };
        model B extends A { x: int32 };
        model C extends B { x: int16 };
        `,
      );
      await testHost.compile("main.tsp");
    });

    it("ensure subtype overriding is not shadowed", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int64 };
        model B extends A { x: int16 };
        model C extends B { x: int32 };
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named x of type int32 which cannot override type int16",
        },
      ]);
    });

    it("removes decorators not specified on derived type that are on the base type", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Base { @doc("Base") h: string;}
        @test model Widget extends Base { h: "test";}
        `,
      );
      const { Widget } = (await testHost.compile("main.tsp")) as { Widget: Model };
      strictEqual(Widget.decorators.length, 1);
      strictEqual((Widget.properties.get("h")!.type as any)!.value, "test");
    });

    it("allow intersection of model with overridden property", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Base {prop: string;}
        model Widget extends Base {prop: "test";}
        @test op foo(): Widget & {};
        `,
      );
      const { foo } = (await testHost.compile("main.tsp")) as { foo: Operation };
      strictEqual(((foo.returnType as Model).properties.get("prop")!.type as any)!.value, "test");
    });

    it("allow spreading of model with overridden property", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Base {h1: string}
        model Widget extends Base {h1: "test"}
        @test model Spread {...Widget}
        `,
      );
      const { Spread } = (await testHost.compile("main.tsp")) as { Spread: Model };
      strictEqual((Spread.properties.get("h1")!.type as any)!.value, "test");
    });

    it("keeps reference of children", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
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
        `,
      );
      const { Pet, Dog, Cat } = (await testHost.compile("main.tsp")) as {
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
      testHost.addTypeSpecFile(
        "main.tsp",
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
        `,
      );
      const { Pet, Dog, Cat } = (await testHost.compile("main.tsp")) as {
        Pet: Model;
        Dog: Model;
        Cat: Model;
      };
      strictEqual(Pet.derivedModels.length, 4);
      strictEqual(Pet.derivedModels[0].name, "TPet");
      ok(isTemplateDeclaration(Pet.derivedModels[0]));

      strictEqual(Pet.derivedModels[1].name, "TPet");
      ok(Pet.derivedModels[1].templateMapper?.args);
      ok("kind" in Pet.derivedModels[1].templateMapper!.args[0]);
      strictEqual(Pet.derivedModels[1].templateMapper.args[0].kind, "Scalar");
      strictEqual(Pet.derivedModels[1].templateMapper.args[0].name, "string");

      strictEqual(Pet.derivedModels[2], Cat);
      strictEqual(Pet.derivedModels[3], Dog);
    });

    it("emit error when extends non model", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends (string | int32) {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models must extend other models.",
      });
    });

    it("emit error when extend model expression", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends {name: string} {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extend model expression via alias", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        alias B = {name: string};
        model A extends B {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extends itself", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends A {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when extends circular reference", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends B {}
        model B extends A {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit no error when extends has property to base model", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends B {}
        model B {
          a: A
        }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
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

    it("keeps reference to source model in sourceModel", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model A { }
        @test  model B is A { };
        `,
      );
      const { A, B } = (await testHost.compile("main.tsp")) as { A: Model; B: Model };
      strictEqual(B.sourceModel, A);
    });

    it("keeps reference to source model in sourceModels", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model A { }
        @test model B is A { };
        `,
      );
      const { A, B } = (await testHost.compile("main.tsp")) as { A: Model; B: Model };
      expect(B.sourceModels).toHaveLength(1);
      strictEqual(B.sourceModels[0].model, A);
      strictEqual(B.sourceModels[0].usage, "is");
    });

    it("copies decorators", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
        @blue model A { }
        @test @red model B is A { };
        `,
      );
      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      ok(blues.has(B));
      ok(reds.has(B));
    });

    it("copies properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { x: int32 }
        @test model B is A { y: string };
        `,
      );
      const { B } = (await testHost.compile("main.tsp")) as { B: Model };
      ok(B.properties.has("x"));
      ok(B.properties.has("y"));
    });

    it("copies heritage", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
        @test model A { x: int32 }
        model B extends A { y: string };
        @test model C is B { }
        `,
      );
      const { A, C } = (await testHost.compile("main.tsp")) as { A: Model; C: Model };
      strictEqual(C.baseModel, A);
      strictEqual(A.derivedModels[1], C);
    });

    it("model is accept array expression", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
        @test model A is string[];
        `,
      );
      const { A } = (await testHost.compile("main.tsp")) as { A: Model };
      ok(isArrayModelType(testHost.program, A));
    });

    it("model is accept array expression of complex type", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
        @test model A is (string | int32)[];
        `,
      );
      const { A } = (await testHost.compile("main.tsp")) as { A: Model };
      ok(isArrayModelType(testHost.program, A));
      strictEqual(A.indexer.value.kind, "Union");
    });

    it("model is array cannot have properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model A is string[] {
          prop: string;
        }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "no-array-properties",
        message: "Array models cannot have any properties.",
      });
    });

    it("model extends array cannot have properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model A extends Array<string> {
          prop: string;
        }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "no-array-properties",
        message: "Array models cannot have any properties.",
      });
    });

    it("doesn't allow duplicate properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./dec.js";
        model A { x: int32 }
        model B is A { x: int32 };
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      match(diagnostics[0].message, /Model already has a property/);
    });

    it("emit error when is non model or array", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is (string | int32) {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` must specify another model.",
      });
    });

    it("emit error when is model expression", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is {name: string} {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is model expression via alias", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        alias B = {name: string};
        model A is B {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is itself", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is A {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit single error when is itself as a templated with multiple instantiations", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A<T> is A<T> {}

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        {
          code: "circular-base-type",
          message: "Type 'A' recursively references itself as a base type.",
        },
      ]);
    });

    it("emit error when 'is' has circular reference", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is B {}
        model B is A {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when 'is' circular reference via extends", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is B {}
        model B extends A {}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit no error when extends has property to base model", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is B {}
        model B {
          a: A
        }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnosticEmpty(diagnostics);
    });

    it("resolve recursive template types", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A<T> {
          c: T;
          b: B
        }
        @test
        model B is A<string> {}
        @test
        model C is A<int32> {}
        `,
      );
      const { B, C } = await testHost.compile("main.tsp");
      strictEqual((B as Model).properties.size, 2);
      strictEqual(((B as Model).properties.get("c")?.type as any).name, "string");
      strictEqual(((B as Model).properties.get("b")?.type as any).name, "B");

      strictEqual((C as Model).properties.size, 2);
      strictEqual(((C as Model).properties.get("c")?.type as any).name, "int32");
      strictEqual(((C as Model).properties.get("b")?.type as any).name, "B");
    });
  });

  describe("spread", () => {
    it("can decorate spread properties independently", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model Base {@doc("base doc") one: string}
        @test model Spread {...Base}

        @@doc(Spread.one, "override for spread");
        `,
      );
      const { Base, Spread } = (await testHost.compile("main.tsp")) as {
        Base: Model;
        Spread: Model;
      };
      strictEqual(getDoc(testHost.program, Spread.properties.get("one")!), "override for spread");
      strictEqual(getDoc(testHost.program, Base.properties.get("one")!), "base doc");
    });

    it("keeps reference to source model in sourceModels", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model A { one: string }
        @test model B { two: string }
        @test model C {...A, ...B}
        `,
      );
      const { A, B, C } = (await testHost.compile("main.tsp")) as { A: Model; B: Model; C: Model };
      expect(C.sourceModels).toHaveLength(2);
      strictEqual(C.sourceModels[0].model, A);
      strictEqual(C.sourceModels[0].usage, "spread");
      strictEqual(C.sourceModels[1].model, B);
      strictEqual(C.sourceModels[1].usage, "spread");
    });

    it("can spread a Record<T>", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model Test {...Record<int32>;}
        `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as {
        Test: Model;
      };
      ok(isRecordModelType(testHost.program, Test));
      strictEqual(Test.indexer?.key.name, "string");
      strictEqual(Test.indexer?.value.kind, "Scalar");
      strictEqual(Test.indexer?.value.name, "int32");
    });

    it("can spread a Record<T> with different value than existing props", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model Test {
          name: string;
          ...Record<int32>;
        }
        `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as {
        Test: Model;
      };
      ok(isRecordModelType(testHost.program, Test));
      const nameProp = Test.properties.get("name");
      strictEqual(nameProp?.type.kind, "Scalar");
      strictEqual(nameProp?.type.name, "string");
      strictEqual(Test.indexer?.key.name, "string");
      strictEqual(Test.indexer?.value.kind, "Scalar");
      strictEqual(Test.indexer?.value.name, "int32");
    });

    it("can spread different records", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model Test {
          ...Record<int32>;
          ...Record<string>;
        }
        `,
      );
      const { Test } = (await testHost.compile("main.tsp")) as {
        Test: Model;
      };
      ok(isRecordModelType(testHost.program, Test));
      strictEqual(Test.indexer?.key.name, "string");
      const indexerValue = Test.indexer?.value;
      strictEqual(indexerValue.kind, "Union");
      const options = [...indexerValue.variants.values()].map((x) => x.type);
      strictEqual(options[0].kind, "Scalar");
      strictEqual(options[0].name, "int32");
      strictEqual(options[1].kind, "Scalar");
      strictEqual(options[1].name, "string");
    });

    it("emit diagnostic if spreading an T[]", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        @test model Test {...Array<int32>;}
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "spread-model",
        message: "Cannot spread properties of non-model type.",
      });
    });
  });

  describe("property circular references", () => {
    it("emit diagnostics if property reference itself", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { a: A.a }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });

    it("emit diagnostics if property reference itself via another prop", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { a: B.a }
        model B { a: A.a }
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });

    it("emit diagnostics if property reference itself via alias", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A { a: B.a }
        model B { a: C }
        alias C = A.a;
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });
  });
});
