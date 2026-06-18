import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Enum, Model, Scalar, Union } from "../../src/core/types.js";
import { expectDiagnosticEmpty, expectDiagnostics, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: declarations as expressions", () => {
  describe("enum", () => {
    it("can be used as a property type", async () => {
      const { Foo } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          status: enum { active, inactive };
        }
      `);
      const type = Foo.properties.get("status")!.type as Enum;
      strictEqual(type.kind, "Enum");
      strictEqual(type.name, "");
      strictEqual(type.expression, true);
      strictEqual(type.members.size, 2);
      ok(type.members.has("active"));
      ok(type.members.has("inactive"));
    });

    it("is not registered in the namespace", async () => {
      const { program } = await Tester.compile(`
        namespace Ns;
        model Foo {
          status: enum { a, b };
        }
      `);
      const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
      strictEqual(ns.enums.size, 0);
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
      strictEqual(type.kind, "Union");
      strictEqual(type.expression, true);
      strictEqual(type.variants.size, 2);
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
      strictEqual(type.kind, "Scalar");
      strictEqual(type.name, "");
      strictEqual(type.expression, true);
      strictEqual(type.baseScalar?.name, "string");
    });

    it("is not registered in the namespace", async () => {
      const { program } = await Tester.compile(`
        namespace Ns;
        model Foo {
          unit: scalar extends string;
        }
      `);
      const ns = program.getGlobalNamespaceType().namespaces.get("Ns")!;
      strictEqual(ns.scalars.size, 0);
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
      strictEqual(type.kind, "Model");
      strictEqual(type.expression, true);
      strictEqual(type.properties.size, 1);
    });

    it("named form can be used as a property type", async () => {
      const { Foo } = await Tester.compile(t.code`
        model ${t.model("Foo")} {
          nested: model Inner { x: string };
        }
      `);
      const type = Foo.properties.get("nested")!.type as Model;
      strictEqual(type.kind, "Model");
      strictEqual(type.expression, true);
      strictEqual(type.properties.size, 1);
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
      strictEqual(ns.models.size, 1);
      ok(ns.models.has("Foo"));
    });
  });

  it("can be nested inside another declaration expression", async () => {
    const { Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        value: model { inner: enum { a, b } };
      }
    `);
    const model = Foo.properties.get("value")!.type as Model;
    strictEqual(model.expression, true);
    const inner = model.properties.get("inner")!.type as Enum;
    strictEqual(inner.kind, "Enum");
    strictEqual(inner.expression, true);
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
});
