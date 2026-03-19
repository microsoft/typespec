import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { describe, expect, it, vi } from "vitest";
import { isTemplateDeclaration } from "../../src/core/type-utils.js";
import { Model, SyntaxKind, Type } from "../../src/core/types.js";
import { Numeric, getDoc, isArrayModelType, isRecordModelType } from "../../src/index.js";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
  mockFile,
  t,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: models", () => {
  it("allow template parameters passed into decorators", async () => {
    let t1: any, t2: any;

    const { B, C } = await Tester.files({
      "dec.js": mockFile.js({
        $myDec(p: any, _t: any, _t1: Model, _t2: Model) {
          t1 = _t1;
          t2 = _t2;
        },
      }),
    }).import("./dec.js").compile(t.code`
      model ${t.model("B")} { }
      model ${t.model("C")} { }
      @myDec(T1, T2)
      model A<T1,T2> {

      }
      alias _ = A<B, C>;
      `);

    strictEqual(t1, B);
    strictEqual(t2, C);
  });

  it("doesn't allow duplicate properties", async () => {
    const diagnostics = await Tester.diagnose(`
      model A { x: int32; x: int32; }
      `);
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Model already has a property/);
  });

  it("emit single error when there is an invalid ref in a templated type", async () => {
    const diagnostics = await Tester.diagnose(`
        model A<T> {t: T, invalid: notValidType }

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `);
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
        const { foo } = await Tester.compile(t.code`
          model A { ${t.modelProperty("foo")}?: ${type} = ${defaultValue} }
          `);
        strictEqual(foo.defaultValue?.valueKind, expectedValue.kind);
        expect((foo.defaultValue as any).value).toMatchObject(expectedValue.value);
      });

      it(`foo?: string[] = #["abc"]`, async () => {
        const { foo } = await Tester.compile(t.code`
        model A { ${t.modelProperty("foo")}?: string[] = #["abc"] }
        `);
        strictEqual(foo.defaultValue?.valueKind, "ArrayValue");
      });

      it(`foo?: {name: string} = #{name: "abc"}`, async () => {
        const { foo } = await Tester.compile(t.code`
        model A { ${t.modelProperty("foo")}?: {name: string} = #{name: "abc"} }
        `);
        strictEqual(foo.defaultValue?.valueKind, "ObjectValue");
      });

      it(`assign scalar for primitive types if not yet`, async () => {
        const { foo } = await Tester.compile(t.code`
        const a = 123;
        model A { ${t.modelProperty("foo")}?: int32 = a }
        `);
        strictEqual(foo.defaultValue?.valueKind, "NumericValue");
        strictEqual(foo.defaultValue.scalar?.kind, "Scalar");
        strictEqual(foo.defaultValue.scalar?.name, "int32");
      });

      it(`foo?: Enum = Enum.up`, async () => {
        const { foo } = await Tester.compile(t.code`
        model A { ${t.modelProperty("foo")}?: TestEnum = TestEnum.up }
        enum TestEnum {up, down}
        `);
        strictEqual(foo.defaultValue?.valueKind, "EnumValue");
        deepStrictEqual(foo.defaultValue?.value.kind, "EnumMember");
        deepStrictEqual(foo.defaultValue?.value.name, "up");
      });

      it(`foo?: Union = Union.up`, async () => {
        const { foo } = await Tester.compile(t.code`
        model A { ${t.modelProperty("foo")}?: Direction = Direction.up }
        union Direction {up: "up-value", down: "down-value"}
        `);
        strictEqual(foo.defaultValue?.valueKind, "StringValue");
        deepStrictEqual(foo.defaultValue?.value, "up-value");
      });
    });

    describe("using a template parameter", () => {
      it(`set it with valid constraint`, async () => {
        const { Test } = await Tester.compile(t.code`
        model A<T extends valueof string> { foo?: string = T }
        model ${t.model("Test")} is A<"Abc">;
        `);
        const foo = Test.properties.get("foo")!;
        strictEqual(foo.defaultValue?.valueKind, "StringValue");
      });

      it(`set it with valid passthrough template constraint`, async () => {
        const diagnostics = await Tester.diagnose(`
          model X<V extends valueof uint32> {
            i: uint32 = V;
          }

          model Y<V extends valueof uint32> {
            x: X<V>;
          }
        `);
        expectDiagnosticEmpty(diagnostics);
      });

      it(`error if constraint is not compatible with property type`, async () => {
        const diagnostics = await Tester.diagnose(`
        model A<T extends valueof int32> { foo?: string = T }
        `);
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
        const diagnostics = await Tester.diagnose(`
          model A { foo?: ${type} = ${defaultValue} }
          `);
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
    const diagnostics = await Tester.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "expect-value",
      message: "D refers to a type, but is being used as a value here.",
      pos,
    });
  });

  it(`doesn't emit additional diagnostic when type is an error`, async () => {
    const diagnostics = await Tester.diagnose(`
        model A { foo?: bool = false }
      `);
    expectDiagnostics(diagnostics, [{ code: "invalid-ref", message: "Unknown identifier bool" }]);
  });

  describe("link model with its properties", () => {
    it("provides parent model of properties", async () => {
      const { A, B } = await Tester.compile(t.code`
        model ${t.model("A")} {
          pA: int32;
        }

        model ${t.model("B")} {
          pB: int32;

        }
        `);

      strictEqual(A.properties.get("pA")?.model, A);
      strictEqual(B.properties.get("pB")?.model, B);
    });

    it("property merged via intersection", async () => {
      const { Test } = await Tester.compile(t.code`
      model A {
        a: string;
      }
      model B {
        b: string;
      }

      model ${t.model("Test")} {prop: A & B}
      `);
      const AB = Test.properties.get("prop")?.type;

      strictEqual(AB?.kind, "Model" as const);
      strictEqual(AB.properties.get("a")?.model, AB);
      strictEqual(AB.properties.get("b")?.model, AB);
    });

    it("property copied via spread", async () => {
      const { Test } = await Tester.compile(t.code`
      model Foo {
        prop: string;
      }

      model ${t.model("Test")} {...Foo}
      `);
      strictEqual(Test.properties.get("prop")?.model, Test);
    });

    it("property copied via `is`", async () => {
      const { Test } = await Tester.compile(t.code`
      model Foo {
        prop: string;
      }

      model ${t.model("Test")} is Foo;
      `);
      strictEqual(Test.properties.get("prop")?.model, Test);
    });
  });

  describe("with extends", () => {
    it("allow subtype to override parent property if subtype is assignable to parent type", async () => {
      await Tester.compile(`
        model A { x: int32 }
        model B extends A { x: int16 };

        model Car { kind: string };
        model Ford extends Car { kind: "Ford" };
        `);
    });

    it("alllow subtype overriding of union", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { x: 1 | 2 | 3 }
        model B extends A { x: 2 };

        model Car { kind: "Ford" | "Toyota" };
        model Ford extends Car { kind: "Ford" };
        `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("alllow subtype overriding of Record", async () => {
      const diagnostics = await Tester.diagnose(`
        model Named {
          name: string;
        }

        model A { x: Named }
        model B extends A { x: {name: "B"} };
        `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("disallow subtype overriding parent property if subtype is not assignable to parent type", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { x: int16 }
        model B extends A { x: int32 };

        model Car { kind: string };
        model Ford extends Car { kind: int32 };
        `);
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
      const diagnostics = await Tester.diagnose(`
        model A { x: int32; }
        model B extends A { x?: int32; }
        `);

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
      const diagnostics = await Tester.diagnose(`
        model A { x: int32; }
        model B extends A { }
        model C extends B { x?: int16; }
        `);

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
      const diagnostics = await Tester.diagnose(`
        model A { x: int32; }
        model B extends A { x?: string; }
        `);

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
      await Tester.compile(`
        model A { x: int64 };
        model B extends A { x: int32 };
        model C extends B { x: int16 };
        `);
    });

    it("ensure subtype overriding is not shadowed", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { x: int64 };
        model B extends A { x: int16 };
        model C extends B { x: int32 };
        `);
      expectDiagnostics(diagnostics, [
        {
          code: "override-property-mismatch",
          message:
            "Model has an inherited property named x of type int32 which cannot override type int16",
        },
      ]);
    });

    it("removes decorators not specified on derived type that are on the base type", async () => {
      const { Widget } = await Tester.compile(t.code`
        model Base { @doc("Base") h: string;}
        model ${t.model("Widget")} extends Base { h: "test";}
        `);
      strictEqual(Widget.decorators.length, 0);
      strictEqual((Widget.properties.get("h")!.type as any)!.value, "test");
    });

    it("allow intersection of model with overridden property", async () => {
      const { foo } = await Tester.compile(t.code`
        model Base {prop: string;}
        model Widget extends Base {prop: "test";}
        op ${t.op("foo")}(): Widget & {};
        `);
      strictEqual(((foo.returnType as Model).properties.get("prop")!.type as any)!.value, "test");
    });

    it("allow spreading of model with overridden property", async () => {
      const { Spread } = await Tester.compile(t.code`
        model Base {h1: string}
        model Widget extends Base {h1: "test"}
        model ${t.model("Spread")} {...Widget}
        `);
      strictEqual((Spread.properties.get("h1")!.type as any)!.value, "test");
    });

    it("keeps reference of children", async () => {
      const { Pet, Dog, Cat } = await Tester.compile(t.code`
        model ${t.model("Pet")} {
          name: true;
        }

        model ${t.model("Cat")} extends Pet {
          meow: true;
        }

        model ${t.model("Dog")} extends Pet {
          bark: true;
        }
        `);
      ok(Pet.derivedModels);
      strictEqual(Pet.derivedModels.length, 2);
      strictEqual(Pet.derivedModels[0], Cat);
      strictEqual(Pet.derivedModels[1], Dog);
    });

    it("keeps reference of children with templates", async () => {
      const { Pet, Dog, Cat } = await Tester.compile(t.code`
        model ${t.model("Pet")} {
          name: true;
        }

        model TPet<T> extends Pet {
          t: T;
        }

        model ${t.model("Cat")} is TPet<string> {
          meow: true;
        }

        model ${t.model("Dog")} is TPet<string> {
          bark: true;
        }
        `);
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
      const diagnostics = await Tester.diagnose(`
        model A extends (string | int32) {}
        `);
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models must extend other models.",
      });
    });

    it("emit error when extend model expression", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends {name: string} {}
        `);
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extend model expression via alias", async () => {
      const diagnostics = await Tester.diagnose(`
        alias B = {name: string};
        model A extends B {}
        `);
      expectDiagnostics(diagnostics, {
        code: "extend-model",
        message: "Models cannot extend model expressions.",
      });
    });

    it("emit error when extends itself", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends A {}
        `);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when extends circular reference", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends B {}
        model B extends A {}
        `);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when extends circular reference with alias - case 1", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends B {}
        model C extends A {}
        alias B = C;
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });

    it("emit error when extends circular reference with alias - case 2", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends B {}
        alias B = A;
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });

    it("emit error when model is circular reference with alias", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is B;
        model C is A;
        alias B = C;
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });
    it("emit error when model is circular reference with alias - case 2", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is B;
        alias B = A;
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'A' recursively references itself as a base type.",
      });
    });

    it("emit no error when extends has property to base model", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends B {}
        model B {
          a: A
        }
        `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("with is", () => {
    it("keeps reference to source model in sourceModel", async () => {
      const { A, B } = await Tester.compile(t.code`
        model ${t.model("A")} { }
        model ${t.model("B")} is A { };
        `);
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
      const blues = new WeakSet();
      const reds = new WeakSet();
      const { B } = await Tester.files({
        "dec.js": mockFile.js({
          $blue(p: any, _t: Type) {
            blues.add(_t);
          },
          $red(p: any, _t: Type) {
            reds.add(_t);
          },
        }),
      }).import("./dec.js").compile(t.code`
        @blue model A { }
        @red model ${t.model("B")} is A { };
        `);
      ok(blues.has(B));
      ok(reds.has(B));
    });

    it("copies properties", async () => {
      const { B } = await Tester.compile(t.code`
        model A { x: int32 }
        model ${t.model("B")} is A { y: string };
        `);
      ok(B.properties.has("x"));
      ok(B.properties.has("y"));
    });

    it("copies heritage", async () => {
      const { A, C } = await Tester.compile(t.code`
        model ${t.model("A")} { x: int32 }
        model B extends A { y: string };
        model ${t.model("C")} is B { }
        `);
      strictEqual(C.baseModel, A);
      strictEqual(A.derivedModels[1], C);
    });

    it("model is accept array expression", async () => {
      const { A } = await Tester.compile(t.code`
        model ${t.model("A")} is string[];
        `);
      ok(isArrayModelType(A));
    });

    it("model is accept array expression of complex type", async () => {
      const { A } = await Tester.compile(t.code`
        model ${t.model("A")} is (string | int32)[];
        `);
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
      const diagnostics = await Tester.diagnose(`
        model A is string[] {
          prop: string;
        }
        `);
      expectDiagnostics(diagnostics, {
        code: "no-array-properties",
        message: "Array models cannot have any properties.",
      });
    });

    it("model extends array cannot have properties", async () => {
      const diagnostics = await Tester.diagnose(`
        model A extends Array<string> {
          prop: string;
        }
        `);
      expectDiagnostics(diagnostics, {
        code: "no-array-properties",
        message: "Array models cannot have any properties.",
      });
    });

    it("doesn't allow duplicate properties", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { x: int32 }
        model B is A { x: int32 };
        `);
      strictEqual(diagnostics.length, 1);
      match(diagnostics[0].message, /Model already has a property/);
    });

    it("emit error when is non model or array", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is (string | int32) {}
        `);
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` must specify another model.",
      });
    });

    it("emit error when is model expression", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is {name: string} {}
        `);
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is model expression via alias", async () => {
      const diagnostics = await Tester.diagnose(`
        alias B = {name: string};
        model A is B {}
        `);
      expectDiagnostics(diagnostics, {
        code: "is-model",
        message: "Model `is` cannot specify a model expression.",
      });
    });

    it("emit error when is itself", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is A {}
        `);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit single error when is itself as a templated with multiple instantiations", async () => {
      const diagnostics = await Tester.diagnose(`
        model A<T> is A<T> {}

        model Bar {
          instance1: A<string>;
          instance2: A<int32>;
        }
        `);
      expectDiagnostics(diagnostics, [
        {
          code: "circular-base-type",
          message: "Type 'A' recursively references itself as a base type.",
        },
      ]);
    });

    it("emit error when 'is' has circular reference", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is B {}
        model B is A {}
        `);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit error when 'is' circular reference via extends", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is B {}
        model B extends A {}
        `);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].message, "Type 'A' recursively references itself as a base type.");
    });

    it("emit no error when extends has property to base model", async () => {
      const diagnostics = await Tester.diagnose(`
        model A is B {}
        model B {
          a: A
        }
        `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("resolve recursive template types", async () => {
      const { B, C } = await Tester.compile(t.code`
        model A<T> {
          c: T;
          b: B
        }
        model ${t.model("B")} is A<string> {}
        model ${t.model("C")} is A<int32> {}
        `);
      strictEqual(B.properties.size, 2);
      strictEqual((B.properties.get("c")?.type as any).name, "string");
      strictEqual((B.properties.get("b")?.type as any).name, "B");

      strictEqual(C.properties.size, 2);
      strictEqual((C.properties.get("c")?.type as any).name, "int32");
      strictEqual((C.properties.get("b")?.type as any).name, "B");
    });

    it("resolves a recursive template model when the recursion is also templated", async () => {
      const $observe = vi.fn();
      const { Result } = await Tester.files({
        "utils.js": mockFile.js({
          $observe,
        }),
      }).import("./utils.js").compile(t.code`
        model A<T> {
          b: T;
          c: C<string>;
        }

        @observe
        model C<U> is A<int32> {
          d: U;
        }

        model ${t.model("Result")} is A<boolean>;
        `);

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
      const { Result } = await Tester.files({
        "utils.js": mockFile.js({
          $observe,
        }),
      }).import("./utils.js").compile(t.code`
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

        model ${t.model("Result")} is X<int32>;
        `);

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
      const { Base, Spread, program } = await Tester.compile(t.code`
        model ${t.model("Base")} {@doc("base doc") one: string}
        model ${t.model("Spread")} {...Base}

        @@doc(Spread.one, "override for spread");
        `);
      strictEqual(getDoc(program, Spread.properties.get("one")!), "override for spread");
      strictEqual(getDoc(program, Base.properties.get("one")!), "base doc");
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
      const { Test } = await Tester.compile(t.code`
        model ${t.model("Test")} {...Record<int32>;}
        `);
      ok(isRecordModelType(Test));
      strictEqual(Test.indexer?.key.name, "string");
      strictEqual(Test.indexer?.value.kind, "Scalar");
      strictEqual(Test.indexer?.value.name, "int32");
    });

    it("can spread a Record<T> with different value than existing props", async () => {
      const { Test } = await Tester.compile(t.code`
        model ${t.model("Test")} {
          name: string;
          ...Record<int32>;
        }
        `);
      ok(isRecordModelType(Test));
      const nameProp = Test.properties.get("name");
      strictEqual(nameProp?.type.kind, "Scalar");
      strictEqual(nameProp?.type.name, "string");
      strictEqual(Test.indexer?.key.name, "string");
      strictEqual(Test.indexer?.value.kind, "Scalar");
      strictEqual(Test.indexer?.value.name, "int32");
    });

    it("can spread different records", async () => {
      const { Test } = await Tester.compile(t.code`
        model ${t.model("Test")} {
          ...Record<int32>;
          ...Record<string>;
        }
        `);
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
      const diagnostics = await Tester.diagnose(`
        model Test {...Array<int32>;}
        `);
      expectDiagnostics(diagnostics, {
        code: "spread-model",
        message: "Cannot spread properties of non-model type.",
      });
    });
  });

  describe("property circular references", () => {
    it("emit diagnostics if property reference itself", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { a: A.a }
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });

    it("emit diagnostics if property reference itself via another prop", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { a: B.a }
        model B { a: A.a }
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });

    it("emit diagnostics if property reference itself via alias", async () => {
      const diagnostics = await Tester.diagnose(`
        model A { a: B.a }
        model B { a: C }
        alias C = A.a;
        `);
      expectDiagnostics(diagnostics, {
        code: "circular-prop",
        message: "Property 'a' recursively references itself.",
      });
    });
  });
});
