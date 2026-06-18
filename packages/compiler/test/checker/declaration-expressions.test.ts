import { describe, expect, it } from "vitest";
import { Enum, Model, Scalar, Union } from "../../src/core/types.js";
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

  it("keyword form is not flattened when used as a `|` operand", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: union { a: int32 } | float32;
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.variants.size).toBe(2);
    // The keyword union is a single nested variant, not flattened into `value`.
    const nested = [...type.variants.values()].map((v) => v.type).find((t) => t.kind === "Union") as
      | Union
      | undefined;
    expect(nested).toBeDefined();
    expect(nested!.variants.has("a")).toBe(true);
  });

  it("does not silently drop colliding variants from keyword unions in a `|`", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: union { a: int32 } | union { a: string };
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    // Both keyword unions are preserved as distinct nested variants (no data loss).
    expect(type.variants.size).toBe(2);
  });

  it("still flattens nested union expressions", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: (string | int32) | float32;
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.variants.size).toBe(3);
  });

  it("still flattens an alias to a union expression", async () => {
    const { Foo } = await Tester.compile(t.code`
      alias AB = string | int32;
      model ${t.model("Foo")} {
        value: AB | float32;
      }
    `);
    const type = Foo.properties.get("value")!.type as Union;
    expect(type.variants.size).toBe(3);
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

  it("named form can be used as a property type", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        nested: model Inner { x: string };
      }
    `);
    const type = Foo.properties.get("nested")!.type as Model;
    expect(type.kind).toBe("Model");
    expect(type.expression).toBe(true);
    expect(type.properties.size).toBe(1);
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

it("compiles without diagnostics when used in alias position", async () => {
  const diagnostics = await Tester.diagnose(`
    alias E = enum { a, b };
    alias U = union { string, int32 };
    alias S = scalar extends string;
    alias M = model { x: string };
  `);
  expectDiagnosticEmpty(diagnostics);
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
