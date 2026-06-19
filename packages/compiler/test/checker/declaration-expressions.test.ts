import { describe, expect, it } from "vitest";
import { Enum, Model, Scalar, Union } from "../../src/core/types.js";
import { getDoc, getTypeName } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("enum", () => {
  it("can be used as a property type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        status: enum { active, inactive };
      }
    `);
    const type = Foo.properties.get("status")!.type as Enum;
    expect(type.kind).toBe("Enum");
    expect(type.name).toBe("");
    expect(type.expression).toBe(true);
    expect(type.members.size).toBe(2);
    expect(type.members.has("active")).toBe(true);
    expect(type.members.has("inactive")).toBe(true);
  });

  it("supports explicit member values", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        status: enum { active: "a", inactive: "i" };
      }
    `);
    const type = Foo.properties.get("status")!.type as Enum;
    expect(type.expression).toBe(true);
    expect(type.members.get("active")!.value).toBe("a");
  });

  it("is not registered in the namespace", async () => {
    const { program } = await Tester.compile(`
      namespace Ns;
      model Foo {
        status: enum { a, b };
      }
    `);
    const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
    expect(ns.enums.size).toBe(0);
  });
});

describe("union", () => {
  it("keyword form can be used as a property type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: union { string, int32 };
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.kind).toBe("Union");
    expect(type.expression).toBe(true);
    expect(type.variants.size).toBe(2);
  });

  it("supports named variants", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: union { foo: string, bar: int32 };
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.expression).toBe(true);
    expect(type.variants.has("foo")).toBe(true);
    expect(type.variants.has("bar")).toBe(true);
  });

  it("keeps its members when used as a `|` operand instead of being flattened", async () => {
    // Regression: a keyword-form union is `expression: true`; it must not be flattened
    // into the parent `|` union (which would silently drop colliding named variants).
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: union { a: "a1", b: "b1" } | union { a: "a2", c: "c1" };
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.kind).toBe("Union");
    expect(type.variants.size).toBe(2);
    for (const variant of type.variants.values()) {
      expect((variant.type as Union).kind).toBe("Union");
      expect((variant.type as Union).variants.size).toBe(2);
    }
  });

  it("is not registered in the namespace", async () => {
    const { program } = await Tester.compile(`
      namespace Ns;
      model Foo {
        value: union { string, int32 };
      }
    `);
    const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
    expect(ns.unions.size).toBe(0);
  });
});

describe("scalar", () => {
  it("can be used as a property type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        unit: scalar extends string;
      }
    `);
    const type = Foo.properties.get("unit")!.type as Scalar;
    expect(type.kind).toBe("Scalar");
    expect(type.name).toBe("");
    expect(type.expression).toBe(true);
    expect(type.baseScalar?.name).toBe("string");
  });

  it("supports constructors", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        unit: scalar extends string {
          init fromValue(value: string);
        };
      }
    `);
    const type = Foo.properties.get("unit")!.type as Scalar;
    expect(type.expression).toBe(true);
    expect(type.constructors.has("fromValue")).toBe(true);
  });

  it("is not registered in the namespace", async () => {
    const { program } = await Tester.compile(`
      namespace Ns;
      model Foo {
        unit: scalar extends string;
      }
    `);
    const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
    expect(ns.scalars.size).toBe(0);
  });
});

describe("model", () => {
  it("keyword form can be used as a property type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: model { x: string };
      }
    `);
    const type = Foo.properties.get("value")!.type as Model;
    expect(type.kind).toBe("Model");
    expect(type.expression).toBe(true);
    expect(type.properties.size).toBe(1);
  });

  it("supports spreading another model", async () => {
    const { Foo } = await Tester.compile(t.code`
      model Base { b: string }
      model ${t.model("Foo")} {
        value: model { ...Base, x: string };
      }
    `);
    const type = Foo.properties.get("value")!.type as Model;
    expect(type.expression).toBe(true);
    expect(type.properties.has("b")).toBe(true);
    expect(type.properties.has("x")).toBe(true);
  });

  it("is not registered in the namespace", async () => {
    const { program } = await Tester.compile(`
      namespace Ns;
      model Foo {
        value: model { x: string };
      }
    `);
    const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
    // Only Foo should be registered, not the anonymous model expression.
    expect(ns.models.size).toBe(1);
    expect(ns.models.has("Foo")).toBe(true);
  });
});

describe("named declaration expressions", () => {
  it("keeps the name on the resulting type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        m: model Inner { x: string };
        e: enum Color { red };
        s: scalar Celsius extends int32;
        u: union Choice { string, int32 };
      }
    `);
    expect((Foo.properties.get("m")!.type as Model).name).toBe("Inner");
    expect((Foo.properties.get("e")!.type as Enum).name).toBe("Color");
    expect((Foo.properties.get("s")!.type as Scalar).name).toBe("Celsius");
    expect((Foo.properties.get("u")!.type as Union).name).toBe("Choice");
  });

  it("is still marked as an expression", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        m: model Inner { x: string };
      }
    `);
    const type = Foo.properties.get("m")!.type as Model;
    expect(type.name).toBe("Inner");
    expect(type.expression).toBe(true);
  });

  it("is not registered in the namespace", async () => {
    const { program } = await Tester.compile(`
      namespace Ns;
      model Foo {
        m: model Inner { x: string };
      }
    `);
    const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
    expect(ns.models.size).toBe(1);
    expect(ns.models.has("Foo")).toBe(true);
    expect(ns.models.has("Inner")).toBe(false);
  });

  it("cannot be referenced by its name", async () => {
    const diagnostics = await Tester.diagnose(`
      alias M = model Inner { x: string };
      model Use { y: Inner }
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier Inner",
    });
  });
});

describe("statement declarations are not expressions", () => {
  it("marks model/enum/union/scalar statements with expression: false", async () => {
    const { M, E, S, U } = await Tester.compile(t.code`
      model ${t.model("M")} {}
      enum ${t.enum("E")} { a }
      scalar ${t.scalar("S")} extends string;
      union ${t.union("U")} { string }
    `);
    expect(M.expression).toBe(false);
    expect(E.expression).toBe(false);
    expect(S.expression).toBe(false);
    expect(U.expression).toBe(false);
  });
});

describe("usage contexts", () => {
  it("resolves through an alias and keeps expression: true", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias E = enum { a, b };
      alias U = union { string, int32 };
      alias S = scalar extends string;
      alias M = model { x: string };
      model ${t.model("Foo")} {
        e: E;
        u: U;
        s: S;
        m: M;
      }
    `);
    expect((Foo.properties.get("e")!.type as Enum).expression).toBe(true);
    expect((Foo.properties.get("u")!.type as Union).expression).toBe(true);
    expect((Foo.properties.get("s")!.type as Scalar).expression).toBe(true);
    expect((Foo.properties.get("m")!.type as Model).expression).toBe(true);
  });

  it("can reference an enclosing template parameter", async () => {
    const { Bar } = await Tester.compile(t.code`
      model Wrapper<T> {
        nested: model { item: T };
      }
      model ${t.model("Bar")} {
        w: Wrapper<int32>;
      }
    `);
    const wrapper = Bar.properties.get("w")!.type as Model;
    const nested = wrapper.properties.get("nested")!.type as Model;
    expect(nested.expression).toBe(true);
    expect((nested.properties.get("item")!.type as Scalar).name).toBe("int32");
  });

  it("can be used as an operation return type", async () => {
    const { test } = await Tester.compile(t.code`
      op ${t.op("test")}(): enum { a, b };
    `);
    const returnType = test.returnType as Enum;
    expect(returnType.kind).toBe("Enum");
    expect(returnType.expression).toBe(true);
  });

  it("can be used as an operation parameter type", async () => {
    const { test } = await Tester.compile(t.code`
      op ${t.op("test")}(value: model { x: string }): void;
    `);
    const paramType = test.parameters.properties.get("value")!.type as Model;
    expect(paramType.kind).toBe("Model");
    expect(paramType.expression).toBe(true);
  });

  it("can be used as a union variant", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: string | enum { a, b };
      }
    `);
    const union = Foo.properties.get("value")!.type as Union;
    expect(union.kind).toBe("Union");
    const variants = [...union.variants.values()];
    const enumVariant = variants.find((v) => (v.type as Enum).kind === "Enum")!;
    expect((enumVariant.type as Enum).expression).toBe(true);
  });

  it("can be nested inside another declaration expression", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: model { inner: enum { a, b } };
      }
    `);
    const model = Foo.properties.get("value")!.type as Model;
    expect(model.expression).toBe(true);
    const inner = model.properties.get("inner")!.type as Enum;
    expect(inner.kind).toBe("Enum");
    expect(inner.expression).toBe(true);
  });

  it("allows member access of an anonymous expression through an alias", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias E = enum { a, b };
      alias A = E.a;
      model ${t.model("Foo")} {
        value: A;
      }
    `);
    expect(Foo.properties.get("value")!.type.kind).toBe("EnumMember");
  });

  it("compiles without diagnostics when used in alias position", async () => {
    const diagnostics = await Tester.diagnose(`
      alias E = enum { a, b };
      alias U = union { string, int32 };
      alias S = scalar extends string;
      alias M = model { x: string };
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});

describe("type name", () => {
  it("renders anonymous expressions inline and is not namespace-qualified", async () => {
    const { Foo } = await Tester.compile(t.code`
      namespace Ns;
      model ${t.model("Foo")} {
        modelProp: model { x: string };
        enumProp: enum { a, b };
        scalarProp: scalar extends string;
        unionProp: union { string, int32 };
      }
    `);
    expect(getTypeName(Foo.properties.get("modelProp")!.type)).toBe("{ x: string }");
    expect(getTypeName(Foo.properties.get("enumProp")!.type)).toBe("{ a, b }");
    expect(getTypeName(Foo.properties.get("scalarProp")!.type)).toBe("scalar extends string");
    expect(getTypeName(Foo.properties.get("unionProp")!.type)).toBe("string | int32");
  });

  it("renders a named expression by its name without a namespace prefix", async () => {
    const { Foo } = await Tester.compile(t.code`
      namespace Ns;
      model ${t.model("Foo")} {
        named: enum Color { red };
      }
    `);
    expect(getTypeName(Foo.properties.get("named")!.type)).toBe("Color");
  });
});

describe("decorators", () => {
  it("applies a decorator to an anonymous enum expression", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        status: @doc("the status") enum { active, inactive };
      }
    `);
    const type = Foo.properties.get("status")!.type as Enum;
    expect(type.kind).toBe("Enum");
    expect(type.expression).toBe(true);
    expect(getDoc(program, type)).toBe("the status");
  });

  it("applies a decorator to a named model declaration expression", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        inner: @doc("the inner") model Inner { x: string };
      }
    `);
    const type = Foo.properties.get("inner")!.type as Model;
    expect(type.kind).toBe("Model");
    expect(type.name).toBe("Inner");
    expect(type.expression).toBe(true);
    expect(getDoc(program, type)).toBe("the inner");
  });

  it("applies a decorator to a keyword union expression", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: @doc("the value") union { string, int32 };
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.kind).toBe("Union");
    expect(type.expression).toBe(true);
    expect(getDoc(program, type)).toBe("the value");
  });

  it("applies a decorator to a scalar expression", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        unit: @doc("the unit") scalar extends string;
      }
    `);
    const type = Foo.properties.get("unit")!.type as Scalar;
    expect(type.kind).toBe("Scalar");
    expect(type.expression).toBe(true);
    expect(getDoc(program, type)).toBe("the unit");
  });

  it("still rejects a decorator before a non-declaration expression", async () => {
    const diagnostics = await Tester.diagnose(`
      model Foo {
        prop: @doc("nope") string;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "invalid-decorator-location",
      message: "Cannot decorate expression.",
    });
  });

  it("allows decorators on members inside the expression", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: enum { @doc("first") a, b };
      }
    `);
    const type = Foo.properties.get("value")!.type as Enum;
    expect(type.expression).toBe(true);
    expect(type.members.has("a")).toBe(true);
  });
});

describe("template parameters are not allowed in expression position", () => {
  it("reports a diagnostic for a templated model expression", async () => {
    const diagnostics = await Tester.diagnose(`alias M = model Foo<T> { x: T };`);
    expectDiagnostics(diagnostics, {
      code: "templated-declaration-in-expression",
    });
  });

  it("reports a diagnostic for a templated union expression", async () => {
    const diagnostics = await Tester.diagnose(`alias U = union Foo<T> { x: T };`);
    expectDiagnostics(diagnostics, {
      code: "templated-declaration-in-expression",
    });
  });

  it("reports a diagnostic for a templated scalar expression", async () => {
    const diagnostics = await Tester.diagnose(`alias S = scalar Foo<T> extends string;`);
    expectDiagnostics(diagnostics, {
      code: "templated-declaration-in-expression",
    });
  });

  it("still allows template parameters in statement position", async () => {
    const diagnostics = await Tester.diagnose(`model Foo<T> { x: T }`);
    expectDiagnosticEmpty(diagnostics);
  });
});
