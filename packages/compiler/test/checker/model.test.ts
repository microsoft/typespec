import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isTemplateDeclaration } from "../../src/core/type-utils.js";
import { Model, ModelProperty, SyntaxKind, Type } from "../../src/core/types.js";
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
  t,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

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
        code: "invalid-ref",
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

    describe("using a template parameter", () => {
      it(`set it with valid constraint`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A<T extends valueof string> { @test foo?: string = T }
        alias Test = A<"Abc">;
        `,
        );
        const { foo } = (await testHost.compile("main.tsp")) as { foo: ModelProperty };
        strictEqual(foo.defaultValue?.valueKind, "StringValue");
      });

      it(`error if constraint is not compatible with property type`, async () => {
        testHost.addTypeSpecFile(
          "main.tsp",
          `
        model A<T extends valueof int32> { @test foo?: string = T }
        `,
        );
        const diagnostics = await testHost.diagnose("main.tsp");
        expectDiagnostics(diagnostics, {
          code: "unassignable",
          message: "Type 'int32' is not assignable to type 'string'",
        });
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
    expectDiagnostics(diagnostics, [{ code: "invalid-ref", message: "Unknown identifier bool" }]);
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

    it("emit error when extends circular reference with alias - case 1", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends B {}
        model C extends A {}
        alias B = C;
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });

    it("emit error when extends circular reference with alias - case 2", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A extends B {}
        alias B = A;
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });

    it("emit error when model is circular reference with alias", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is B;
        model C is A;
        alias B = C;
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });
    it("emit error when model is circular reference with alias - case 2", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model A is B;
        alias B = A;
        `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
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
      const { A, B, pos } = await Tester.compile(t.code`
        model ${t.model("A")} {}
        model ${t.model("B")} is /*ASource*/A;
      `);
      expect(B.sourceModels).toHaveLength(1);
      strictEqual(B.sourceModels[0].model, A);
      strictEqual(B.sourceModels[0].usage, "is");
      strictEqual(B.sourceModels[0].node?.kind, SyntaxKind.TypeReference);
      strictEqual(B.sourceModels[0].node.pos, pos.ASource.pos);
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
      ok(isArrayModelType(A));
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
      ok(isArrayModelType(A));
      strictEqual(A.indexer.value.kind, "Union");
    });

    // https://github.com/microsoft/typespec/issues/2826
    describe("ensure the target model is completely resolved before spreading", () => {
      it("declared before", async () => {
        const { B } = await Tester.compile(t.code`
          model ${t.model("B")} is A;
          model A {
            b: B;
            prop: string;
          }
        
        `);
        expect(B.properties.has("b")).toBe(true);
        expect(B.properties.has("prop")).toBe(true);
      });

      it("declared after", async () => {
        const { B } = await Tester.compile(t.code`
          model A {
            b: B;
            prop: string;
          }
          model ${t.model("B")} is A;
        `);
        expect(B.properties.has("b")).toBe(true);
        expect(B.properties.has("prop")).toBe(true);
      });
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

    it("resolves a recursive template model when the recursion is also templated", async () => {
      const $observe = vi.fn();
      testHost.addJsFile("utils.js", {
        $observe,
      });
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./utils.js";

        model A<T> {
          b: T;
          c: C<string>;
        }

        @observe
        model C<U> is A<int32> {
          d: U;
        }

        @test
        model Result is A<boolean>;
        `,
      );

      const { Result } = (await testHost.compile("main.tsp")) as { Result: Model | undefined };

      ok(Result);
      strictEqual(Result.properties.size, 2);
      strictEqual((Result.properties.get("b")?.type as any).name, "boolean");
      const cProp = Result.properties.get("c")?.type;
      ok(cProp);
      ok(cProp.kind === "Model");
      strictEqual(cProp.properties.size, 3);
      strictEqual((cProp.properties.get("b")?.type as any).name, "int32");
      strictEqual((cProp.properties.get("c")?.type as any).name, "C");
      strictEqual((cProp.properties.get("d")?.type as any).name, "string");

      // Just checking that the inner layer is identical
      const innerCProp = cProp.properties.get("c")?.type;
      strictEqual(innerCProp, cProp);

      expect($observe).toHaveBeenCalledTimes(1);
    });

    it("resolves a cyclic recursion with a property aliased to a recursive spread", async () => {
      const $observe = vi.fn();
      testHost.addJsFile("utils.js", {
        $observe,
      });
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        import "./utils.js";

        model X<T> {
          prop: T;
          y: Y<T>;
        }

        model Y<T> is X<string> {
          extra: Z<T>;
        }

        alias Z<T> = {
          @observe foo: T;
          ...X<string>
        };

        @test model Result is X<int32>;
        `,
      );

      const { Result } = (await testHost.compile("main.tsp")) as { Result: Model | undefined };

      ok(Result);
      strictEqual(Result.properties.size, 2);
      strictEqual((Result.properties.get("prop")?.type as any).name, "int32");
      const yProp = Result.properties.get("y")?.type;
      ok(yProp);
      ok(yProp.kind === "Model");
      strictEqual(yProp.properties.size, 3);
      strictEqual((yProp.properties.get("prop")?.type as any).name, "string");
      const zProp = yProp.properties.get("extra")?.type;
      ok(zProp);
      ok(zProp.kind === "Model");
      strictEqual(zProp.properties.size, 3);
      strictEqual((zProp.properties.get("foo")?.type as any).name, "int32");
      strictEqual((zProp.properties.get("y")?.type as any).name, "Y");
      strictEqual((zProp.properties.get("prop")?.type as any).name, "string");

      const innerXFromZ = zProp.properties.get("y")?.type;
      ok(innerXFromZ);
      ok(innerXFromZ.kind === "Model");
      strictEqual(innerXFromZ.properties.size, 3);
      strictEqual((innerXFromZ.properties.get("prop")?.type as any).name, "string");
      const innerYFromZ = innerXFromZ.properties.get("y")?.type;
      ok(innerYFromZ);
      ok(innerYFromZ.kind === "Model");
      strictEqual(innerYFromZ.properties.size, 3);
      strictEqual((innerYFromZ.properties.get("prop")?.type as any).name, "string");
      const innerZFromZ = innerYFromZ.properties.get("extra")?.type;
      ok(innerZFromZ);
      ok(innerZFromZ.kind === "Model");
      strictEqual(innerZFromZ.properties.size, 3);
      strictEqual((innerZFromZ.properties.get("foo")?.type as any).name, "string");
      strictEqual((innerZFromZ.properties.get("y")?.type as any).name, "Y");
      strictEqual((innerZFromZ.properties.get("prop")?.type as any).name, "string");

      // Called twice, once for Z<string> and once for Z<int32>
      expect($observe).toHaveBeenCalledTimes(2);
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
      const { A, B, C, pos } = await Tester.compile(t.code`
        model ${t.model("A")} { one: string }
        model ${t.model("B")} { two: string }
        model ${t.model("C")} {.../*ASpread*/A, .../*BSpread*/B}
        `);
      expect(C.sourceModels).toHaveLength(2);
      strictEqual(C.sourceModels[0].model, A);
      strictEqual(C.sourceModels[0].usage, "spread");
      strictEqual(C.sourceModels[0].node?.kind, SyntaxKind.TypeReference);
      strictEqual(C.sourceModels[0].node.pos, pos.ASpread.pos);
      strictEqual(C.sourceModels[1].model, B);
      strictEqual(C.sourceModels[1].usage, "spread");
      strictEqual(C.sourceModels[1].node?.kind, SyntaxKind.TypeReference);
      strictEqual(C.sourceModels[1].node.pos, pos.BSpread.pos);
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
      ok(isRecordModelType(Test));
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
      ok(isRecordModelType(Test));
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
      ok(isRecordModelType(Test));
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

  describe("inline named model expressions", () => {
    it("creates a named model for inline model expression", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child {
            age: int32;
          };
        }
      `,
      );
      const { child } = (await testHost.compile("main.tsp")) as { child: ModelProperty };
      strictEqual(child.type.kind, "Model");
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(childModel.properties.size, 1);
      ok(childModel.properties.has("age"));
    });

    it("inline named model has correct property types", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child {
            name: string;
            value: int32;
          };
        }
      `,
      );
      const { child } = (await testHost.compile("main.tsp")) as { child: ModelProperty };
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(childModel.properties.size, 2);
      ok(childModel.properties.has("name"));
      ok(childModel.properties.has("value"));
    });

    it("inline named model with empty body", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child { };
        }
      `,
      );
      const { child } = (await testHost.compile("main.tsp")) as { child: ModelProperty };
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(childModel.properties.size, 0);
    });

    it("augment decorator on inline named model", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child {
            name: string;
          };
        }
        @@doc(Child, "Hello child!");
      `,
      );
      const { child } = (await testHost.compile("main.tsp")) as { child: ModelProperty };
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(getDoc(testHost.program, childModel), "Hello child!");
    });

    it("nested inline named models", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child {
            @test grandchild: model Grandchild {
              age: int32;
            };
          };
        }
      `,
      );
      const { child, grandchild } = (await testHost.compile("main.tsp")) as {
        child: ModelProperty;
        grandchild: ModelProperty;
      };
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(childModel.properties.size, 1);

      const grandchildModel = grandchild.type as Model;
      strictEqual(grandchildModel.name, "Grandchild");
      strictEqual(grandchildModel.properties.size, 1);
      ok(grandchildModel.properties.has("age"));
    });

    it("deeply nested inline named models with augment decorators", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          @test child: model Child {
            @test grandchild: model Grandchild {
              age: int32;
            };
          };
        }
        @@doc(Child, "The child model");
        @@doc(Grandchild, "The grandchild model");
      `,
      );
      const { child, grandchild } = (await testHost.compile("main.tsp")) as {
        child: ModelProperty;
        grandchild: ModelProperty;
      };
      const childModel = child.type as Model;
      strictEqual(getDoc(testHost.program, childModel), "The child model");

      const grandchildModel = grandchild.type as Model;
      strictEqual(getDoc(testHost.program, grandchildModel), "The grandchild model");
    });

    it("inline named model with spread properties", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Base { id: int32; }
        model Parent {
          @test child: model Child {
            ...Base;
            name: string;
          };
        }
      `,
      );
      const { child } = (await testHost.compile("main.tsp")) as { child: ModelProperty };
      const childModel = child.type as Model;
      strictEqual(childModel.name, "Child");
      strictEqual(childModel.properties.size, 2);
      ok(childModel.properties.has("id"));
      ok(childModel.properties.has("name"));
    });

    it("reports duplicate when two inline named models have the same name", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          child1: model Conflict { age: int32; };
          child2: model Conflict { name: string; };
        }
      `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        { code: "duplicate-symbol", message: /Conflict/ },
        { code: "duplicate-symbol", message: /Conflict/ },
      ]);
    });

    it("reports duplicate when inline named model conflicts with top-level model", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Child { value: int32; }
        model Parent {
          child: model Child { age: int32; };
        }
      `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        { code: "duplicate-symbol", message: /Child/ },
        { code: "duplicate-symbol", message: /Child/ },
      ]);
    });

    it("reports duplicate when nested inline named model reuses parent inline name", async () => {
      testHost.addTypeSpecFile(
        "main.tsp",
        `
        model Parent {
          child: model Child {
            grandchild: model Child { age: int32; };
          };
        }
      `,
      );
      const diagnostics = await testHost.diagnose("main.tsp");
      expectDiagnostics(diagnostics, [
        { code: "duplicate-symbol", message: /Child/ },
        { code: "duplicate-symbol", message: /Child/ },
      ]);
    });
  });
});
