import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import type { Model, Scalar, Union, UnionVariant } from "../../src/core/types.js";
import {
  type TestCompileOptions,
  expectDiagnosticEmpty,
  expectDiagnostics,
  expectTypeEquals,
  mockFile,
  t,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

const unionExtendsOptions: TestCompileOptions = {
  compilerOptions: {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features: ["union-extends"],
      diagnostics: [],
      outputDir: "tsp-output",
    },
  },
};

function diagnoseUnionExtends(code: string) {
  return Tester.diagnose(code, unionExtendsOptions);
}

describe("declarations", () => {
  it("can be declared and decorated", async () => {
    const blues = new WeakSet();
    const { Foo } = await Tester.files({
      "test.js": mockFile.js({
        $blue(p: any, t: Union | UnionVariant) {
          blues.add(t);
        },
      }),
    }).import("./test.js").compile(t.code`
      @blue union ${t.union("Foo")} { @blue x: int32; y: int16 };
    `);

    ok(blues.has(Foo));
    strictEqual(Foo.variants.size, 2);
    const varX = Foo.variants.get("x")!;
    ok(blues.has(varX));
    const varY = Foo.variants.get("y")!;
    const varXType = (varX as UnionVariant).type;
    const varYType = (varY as UnionVariant).type;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varY.kind, "UnionVariant");

    strictEqual(varXType.kind, "Scalar");
    strictEqual(varYType.kind, "Scalar");
  });

  it("can omit union variant names", async () => {
    const blues = new WeakSet();
    const { Foo } = await Tester.files({
      "test.js": mockFile.js({
        $blue(p: any, t: Union | UnionVariant) {
          blues.add(t);
        },
      }),
    }).import("./test.js").compile(t.code`
      union Template<T> { 
        @blue x: int32;
        @blue int16;
        @blue T;
      };
      alias ${t.union("Foo")} = Template<string>;
    `);
    const variants = Array.from(Foo.variants.values());
    ok(blues.has(variants[0]));
    ok(blues.has(variants[1]));
    ok(blues.has(variants[2]));

    strictEqual(variants[0].name, "x");
    ok(typeof variants[1].name === "symbol");
    ok(typeof variants[2].name === "symbol");
  });

  it("can be templated", async () => {
    const { Foo } = await Tester.compile(t.code`
      union Template<T> { x: T };
      alias ${t.union("Foo")} = Template<int32>;
    `);
    const varX = Foo.variants.get("x")!;
    const varXType = (varX as UnionVariant).type as Model;

    strictEqual(varX.kind, "UnionVariant");
    strictEqual(varXType.kind, "Scalar");
    strictEqual(varXType.name, "int32");
  });
});

describe("extends", () => {
  it("reports an experimental feature warning when the feature is not enabled", async () => {
    const diagnostics = await Tester.diagnose(`
      model PetBase { name: string }
      union Pet extends PetBase { base: PetBase }
    `);

    expectDiagnostics(diagnostics, {
      code: "experimental-feature",
      message:
        "Union `extends` clauses are an experimental feature that may change in the future. Use with caution and consider providing feedback to the TypeSpec team.",
    });
  });

  it("does not report an experimental feature warning when the feature is enabled", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model PetBase { name: string }
      union Pet extends PetBase { base: PetBase }
    `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("supports an enum base type", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      enum PetKind {
        cat,
        dog,
      }

      union Pet extends PetKind {
        cat: PetKind.cat,
        dog: PetKind.dog,
      }
    `);

    expectDiagnosticEmpty(diagnostics);
  });

  it.each([
    {
      name: "interface",
      declaration: "interface Base {}",
      baseType: "Base",
    },
    {
      name: "operation",
      declaration: "op base(): void;",
      baseType: "base",
    },
    {
      name: "function type",
      declaration: "",
      baseType: "fn () => string",
    },
    {
      name: "tuple",
      declaration: "",
      baseType: "[string]",
    },
    {
      name: "literal",
      declaration: "",
      baseType: '"base"',
    },
    {
      name: "intrinsic type",
      declaration: "",
      baseType: "unknown",
    },
  ])("rejects a $name as the base type", async ({ declaration, baseType }) => {
    const diagnostics = await diagnoseUnionExtends(`
      ${declaration}
      union Pet extends ${baseType} { value: string }
    `);

    expectDiagnostics(diagnostics, {
      code: "extend-union",
      message: "Union `extends` must specify a model, scalar, enum, or union.",
    });
  });

  it("rejects a model expression as the base type", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Pet extends { name: string } {
        cat: { name: "cat" },
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "extend-union",
      message: "Unions cannot extend model expressions.",
    });
  });

  it("rejects an aliased model expression as the base type", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      alias PetBase = { name: string };
      union Pet extends PetBase {
        cat: { name: "cat" },
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "extend-union",
      message: "Unions cannot extend model expressions.",
    });
  });

  it("sets baseType on the union type", async () => {
    const { Pet, PetBase } = await Tester.compile(
      t.code`
        model ${t.model("PetBase")} { name: string }
        model Cat extends PetBase { toy: string }
        model Dog extends PetBase { food: string }

        union ${t.union("Pet")} extends PetBase {
          cat: Cat,
          dog: Dog,
        }
      `,
      unionExtendsOptions,
    );

    expectTypeEquals(Pet.baseType, PetBase);
  });

  it("baseType is undefined when there is no extends clause", async () => {
    const { Pet } = await Tester.compile(t.code`
      model Cat { name: string }
      union ${t.union("Pet")} { cat: Cat }
    `);

    strictEqual(Pet.baseType, undefined);
  });

  it("does not add the base type as a variant", async () => {
    const { Pet } = await Tester.compile(
      t.code`
        model PetBase { name: string }
        model Cat extends PetBase { toy: string }

        union ${t.union("Pet")} extends PetBase { cat: Cat }
      `,
      unionExtendsOptions,
    );

    strictEqual(Pet.variants.size, 1);
    ok(Pet.variants.has("cat"));
  });

  it("accepts variants that structurally satisfy the base type without extending it", async () => {
    // Per the design, `extends` is an assignability constraint, not a nominal one.
    const diagnostics = await diagnoseUnionExtends(`
      model PetBase { name: string }
      model Cat { name: string, toy: string }
      model Dog extends PetBase { food: string }

      union Pet extends PetBase {
        cat: Cat,
        dog: Dog,
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accepts the base type itself as a variant", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model PetBase { name: string }
      model Cat extends PetBase { toy: string }

      union Pet extends PetBase {
        cat: Cat,
        base: PetBase,
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("emits a diagnostic on the variant that doesn't satisfy the constraint", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model PetBase { name: string }
      model Cat extends PetBase { toy: string }
      model Rock { hardness: int32 }

      union Pet extends PetBase {
        cat: Cat,
        rock: Rock,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
      message: /Type 'Rock' is not assignable to type 'PetBase'/,
    });
  });

  it("emits one diagnostic per offending variant", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model PetBase { name: string }
      model Rock { hardness: int32 }
      model Tree { height: int32 }

      union Pet extends PetBase {
        rock: Rock,
        tree: Tree,
      }
    `);
    expectDiagnostics(diagnostics, [
      { code: "unassignable", message: /Type 'Rock' is not assignable to type 'PetBase'/ },
      { code: "unassignable", message: /Type 'Tree' is not assignable to type 'PetBase'/ },
    ]);
  });

  it("works with unnamed variants", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Status extends string {
        "start",
        "stop",
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("emits a diagnostic for an unnamed variant that doesn't satisfy the constraint", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Status extends string {
        "start",
        123,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
      message: "Type '123' is not assignable to type 'string'",
    });
  });

  it("supports composing unions declared with extends", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union OperationStatus extends string {
        "Running",
        "Succeeded",
        "Failure",
      }

      union ServiceOperationStatus extends string {
        OperationStatus,
        "NotStarted",
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("supports a scalar base type", async () => {
    const { Status, string: stringType } = await Tester.compile(
      t.code`
        union ${t.union("Status")} extends ${t.scalar("string")} {
          "start",
          "stop",
        }
      `,
      unionExtendsOptions,
    );
    expectTypeEquals(Status.baseType, stringType);
  });

  it("supports a union expression as the base type", async () => {
    const { Foo } = await Tester.compile(
      t.code`
        union ${t.union("Foo")} extends string | int32 {
          a: string,
          b: int32,
        }
      `,
      unionExtendsOptions,
    );
    strictEqual(Foo.baseType?.kind, "Union");
  });

  it("emits a diagnostic when a variant doesn't satisfy a union expression base type", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Foo extends string | int32 {
        a: string,
        b: boolean,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
      message: "Type 'boolean' is not assignable to type 'string | int32'",
    });
  });

  it("supports an intersection as the base type", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model A { a: string }
      model B { b: string }
      model AB { a: string, b: string, c: string }

      union Foo extends A & B {
        ab: AB,
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("supports a templated base type reference", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      model Wrapper<T> { value: T }

      union Foo extends Wrapper<string> {
        a: Wrapper<string>,
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  describe("templates", () => {
    it("checks the constraint on instantiation", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union Foo<T> extends string {
          value: T,
        }

        alias Bad = Foo<int32>;
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'int32' is not assignable to type 'string'",
      });
    });

    it("does not report on a valid instantiation", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union Foo<T> extends string {
          value: T,
        }

        alias Good = Foo<"abc">;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report on the uninstantiated template declaration", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union Foo<T> extends string {
          value: T,
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("supports a template parameter as the base type", async () => {
      const { Foo, string: stringType } = await Tester.compile(
        t.code`
          union Template<T> extends T {
            value: string,
          }

          alias ${t.union("Foo")} = Template<${t.scalar("string")}>;
        `,
        unionExtendsOptions,
      );
      expectTypeEquals(Foo.baseType, stringType);
    });

    it("emits a diagnostic when a variant doesn't satisfy a template parameter base type", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union Template<T> extends T {
          value: string,
        }

        alias Bad = Template<int32>;
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'string' is not assignable to type 'int32'",
      });
    });
  });

  describe("circular references", () => {
    it("reports a diagnostic when a union extends itself", async () => {
      const diagnostics = await diagnoseUnionExtends(`union a extends a { x: string }`);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("reports a diagnostic when a union extends itself via another union", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union a extends b { x: string }
        union b extends a { x: string }
      `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("reports a diagnostic when a union extends itself via an alias", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union a extends b { x: string }
        alias b = a;
      `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("reports a diagnostic when a union references itself in a union expression", async () => {
      const diagnostics = await diagnoseUnionExtends(`union a extends a | string { x: string }`);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("reports a diagnostic when a union references itself in a nested union expression", async () => {
      const diagnostics = await diagnoseUnionExtends(
        `union a extends string | (int32 | a) { x: string }`,
      );
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("reports a diagnostic when a union references itself in a union expression via an alias", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        union a extends b { x: string }
        alias b = a | string;
      `);
      expectDiagnostics(diagnostics, {
        code: "circular-base-type",
        message: "Type 'a' recursively references itself as a base type.",
      });
    });

    it("doesn't set a base type when a circular reference is reported", async () => {
      const [{ a }, diagnostics] = await Tester.compileAndDiagnose(
        t.code`union ${t.union("a")} extends a | string { x: string }`,
        unionExtendsOptions,
      );
      expectDiagnostics(diagnostics, { code: "circular-base-type" });
      strictEqual(a.baseType, undefined);
    });

    it("allows a union to reference itself from a model reachable from the base type", async () => {
      // Cyclic type graphs are legal in TypeSpec (e.g. `model Foo { foo: Foo }`) so this must
      // not be reported as a circular base type.
      const [{ a }, diagnostics] = await Tester.compileAndDiagnose(
        t.code`
          model Box { inner: a }
          union ${t.union("a")} extends Box { x: Box }
        `,
        unionExtendsOptions,
      );
      expectDiagnosticEmpty(diagnostics);
      strictEqual(a.baseType?.kind, "Model");
    });
  });

  it("doesn't cascade errors when the base type cannot be resolved", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Foo extends NotDefined {
        a: string,
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier NotDefined",
    });
  });

  it("reports a diagnostic when the base type is a value", async () => {
    const diagnostics = await diagnoseUnionExtends(`
      union Foo extends #{ a: 1 } {
        a: string,
      }
    `);
    expectDiagnostics(diagnostics, [{ code: "value-in-type" }]);
  });

  describe("deprecation", () => {
    it("reports the deprecation of the base type", async () => {
      const diagnostics = await diagnoseUnionExtends(`
        #deprecated "Use NewBase instead"
        model Base {}

        union Foo extends Base {
          a: {},
        }
      `);
      expectDiagnostics(diagnostics, [
        { code: "deprecated", message: "Deprecated: Use NewBase instead" },
      ]);
    });

    it("doesn't report the deprecation of the base type when the union is deprecated", async () => {
      // Same mitigation as `model Foo extends Base`: a deprecated declaration is allowed to
      // reference deprecated types without adding noise.
      const diagnostics = await diagnoseUnionExtends(`
        #deprecated "Use NewBase instead"
        model Base {}

        #deprecated "Use NewFoo instead"
        union Foo extends Base {
          a: {},
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't copy the deprecation of the base type onto the union", async () => {
      // `extends` on a union is a constraint, not inheritance, so the deprecation must not
      // propagate to the union the way it does for `scalar`.
      const diagnostics = await diagnoseUnionExtends(`
        #deprecated "Use NewBase instead"
        model Base {}

        union Foo extends Base {
          a: {},
        }

        model Usage {
          foo: Foo,
        }
      `);
      expectDiagnostics(diagnostics, [
        { code: "deprecated", message: "Deprecated: Use NewBase instead" },
      ]);
    });
  });

  it("keeps a per-instantiation base type", async () => {
    const { Foo, Bar } = await Tester.compile(
      t.code`
        union Template<T> extends T {
          value: T,
        }

        alias ${t.union("Foo")} = Template<string>;
        alias ${t.union("Bar")} = Template<int32>;
      `,
      unionExtendsOptions,
    );

    strictEqual((Foo.baseType as Scalar).name, "string");
    strictEqual((Bar.baseType as Scalar).name, "int32");
  });
});

describe("expressions", () => {
  it("reduces union expressions and gives them symbol keys", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias Temp<T, U> = T | U;
      alias ${t.union("Foo")} = Temp<int16 | int32, string | int8>;
    `);

    strictEqual(Foo.variants.size, 4);
    for (const key of Foo.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("doesn't reduce union statements", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias Temp<T, U> = T | U;
      union Bar { x: int16, y: int32 };
      alias ${t.union("Foo")} = Temp<Bar, string | int8>;
    `);
    strictEqual(Foo.variants.size, 3);
    for (const key of Foo.variants.keys()) {
      strictEqual(typeof key, "symbol");
    }
  });

  it("reduces nevers", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias ${t.union("Foo")} = string | never;  
    `);
    strictEqual(Foo.variants.size, 1);
  });

  it("set namespace", async () => {
    const { Foo, MyNs } = await Tester.compile(t.code`
      namespace ${t.namespace("MyNs")};
      alias ${t.union("Foo")} = string | int32;  
    `);
    expectTypeEquals(Foo.namespace, MyNs);
  });
});
