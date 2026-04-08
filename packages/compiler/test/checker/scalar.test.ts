import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics, expectTypeEquals, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: scalars", () => {
  it("declare simple scalar", async () => {
    const { A } = await Tester.compile(t.code`
      scalar ${t.scalar("A")};
    `);

    strictEqual(A.kind, "Scalar");
    strictEqual(A.name, "A");
    strictEqual(A.baseScalar, undefined);
  });

  it("declare simple scalar extending another", async () => {
    const { A, program } = await Tester.compile(t.code`
      scalar ${t.scalar("A")} extends numeric;
    `);

    strictEqual(A.kind, "Scalar");
    strictEqual(A.name, "A");
    strictEqual(A.baseScalar, program.checker.getStdType("numeric"));
  });

  it("declare scalar with template parameters", async () => {
    const { A } = await Tester.compile(t.code`
      @doc(T)
      scalar ${t.scalar("A")}<T extends valueof string>;

      alias B = A<"123">;
    `);

    strictEqual(A.kind, "Scalar");
    strictEqual(A.name, "A");
  });

  // Test for https://github.com/microsoft/typespec/issues/1764
  it("template parameter are scoped to the scalar", async () => {
    const { A, B } = await Tester.compile(t.code`
      @doc(T) scalar ${t.scalar("A")}<T extends valueof string>;
      @doc(T) scalar ${t.scalar("B")}<T extends valueof string>;

      alias AIns = A<"">;
      alias BIns = B<"">;
    `);

    strictEqual(A.kind, "Scalar");
    strictEqual(B.kind, "Scalar");
  });

  it("allows a decimal to have a default value", async () => {
    const { A } = await Tester.compile(t.code`
      model ${t.model("A")} {
        x: decimal = 42;
      }
    `);

    const def = A.properties.get("x")!.defaultValue!;
    strictEqual(def.valueKind, "NumericValue");
    strictEqual(def.value.asNumber(), 42);
  });

  describe("custom scalars and default values", () => {
    it("allows custom numeric scalar to have a default value", async () => {
      const { S, M } = await Tester.compile(t.code`
      scalar ${t.scalar("S")} extends int32;
      model ${t.model("M")} { p?: S = 42; }
    `);

      strictEqual(S.kind, "Scalar");
      strictEqual(M.kind, "Model");
      const p = M.properties.get("p");
      ok(p);
      expectTypeEquals(p.type, S);
      strictEqual(p.defaultValue?.valueKind, "NumericValue");
      strictEqual(p.defaultValue.value.asNumber(), 42);
    });

    it("allows custom boolean scalar to have a default value", async () => {
      const { S, M } = await Tester.compile(t.code`
      scalar ${t.scalar("S")} extends boolean;
      model ${t.model("M")} { p?: S = true; }
    `);

      strictEqual(S.kind, "Scalar");
      strictEqual(M.kind, "Model");
      const p = M.properties.get("p");
      ok(p);
      expectTypeEquals(p.type, S);
      strictEqual(p.defaultValue?.valueKind, "BooleanValue");
      strictEqual(p.defaultValue.value, true);
    });

    it("allows custom string scalar to have a default value", async () => {
      const { S, M } = await Tester.compile(t.code`
      scalar ${t.scalar("S")} extends string;
      model ${t.model("M")} { p?: S = "hello"; }
    `);

      strictEqual(S.kind, "Scalar");
      strictEqual(M.kind, "Model");
      const p = M.properties.get("p");
      ok(p);
      expectTypeEquals(p.type, S);
      strictEqual(p.defaultValue?.valueKind, "StringValue");
      strictEqual(p.defaultValue.value, "hello");
    });

    it("does not allow custom numeric scalar to have a default outside range", async () => {
      const diagnostics = await Tester.diagnose(`
      namespace SomeNamespace;
      scalar S extends int8;
      model M { p?: S = 9999; }
    `);
      expectDiagnostics(diagnostics, [{ code: "unassignable", message: /9999.*S/ }]);
    });

    it("does not allow non-numeric/boolean/string custom scalar to have a default", async () => {
      const diagnostics = await Tester.diagnose(`
      scalar S;
      model M { p?: S = 42; }
    `);
      expectDiagnostics(diagnostics, [{ code: "unassignable", message: /42.*S/ }]);
    });
  });

  describe("circular references", () => {
    describe("emit diagnostic when circular reference in extends", () => {
      it("reference itself", async () => {
        const diagnostics = await Tester.diagnose(`scalar a extends a;`);
        expectDiagnostics(diagnostics, {
          code: "circular-base-type",
          message: "Type 'a' recursively references itself as a base type.",
        });
      });
      it("reference itself via another scalar", async () => {
        const diagnostics = await Tester.diagnose(`
          scalar a extends b;
          scalar b extends a;
        `);
        expectDiagnostics(diagnostics, {
          code: "circular-base-type",
          message: "Type 'a' recursively references itself as a base type.",
        });
      });
      it("reference itself via an alias", async () => {
        const diagnostics = await Tester.diagnose(`
          scalar a extends b;
          alias b = a;
        `);
        expectDiagnostics(diagnostics, {
          code: "circular-base-type",
          message: "Type 'a' recursively references itself as a base type.",
        });
      });
    });
  });
});
