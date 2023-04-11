import { ok, strictEqual } from "assert";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
  expectIdenticalTypes,
} from "../../testing/index.js";

describe("compiler: scalars", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createTestHost();
    runner = createTestWrapper(host);
  });

  it("declare simple scalar", async () => {
    const { A } = await runner.compile(`
      @test scalar A;
    `);

    strictEqual(A.kind, "Scalar" as const);
    strictEqual(A.name, "A");
    strictEqual(A.baseScalar, undefined);
  });

  it("declare simple scalar extending another", async () => {
    const { A } = await runner.compile(`
      @test scalar A extends numeric;
    `);

    strictEqual(A.kind, "Scalar" as const);
    strictEqual(A.name, "A");
    strictEqual(A.baseScalar, runner.program.checker.getStdType("numeric"));
  });

  it("declare scalar with template parameters", async () => {
    const { A } = await runner.compile(`
      @doc(T)
      @test
      scalar A<T extends string>;

      alias B = A<"123">;
    `);

    strictEqual(A.kind, "Scalar" as const);
    strictEqual(A.name, "A");
  });

  // https://github.com/microsoft/typespec/issues/1764
  it("template parameter are scoped to the scalar", async () => {
    const { A, B } = await runner.compile(`
      @test @doc(T) scalar A<T extends string>;
      @test @doc(T) scalar B<T extends string>;

      alias AIns = A<"">;
      alias BIns = B<"">;
    `);

    strictEqual(A.kind, "Scalar" as const);
    strictEqual(B.kind, "Scalar" as const);
  });

  describe("custom scalars and default values", () => {
    it("allows custom numeric scalar to have a default value", async () => {
      const { S, M } = await runner.compile(`
      @test scalar S extends int32;
      @test model M { p?: S = 42; }
    `);

      strictEqual(S.kind, "Scalar" as const);
      strictEqual(M.kind, "Model" as const);
      const p = M.properties.get("p");
      ok(p);
      expectIdenticalTypes(p.type, S);
      strictEqual(p.default?.kind, "Number" as const);
      strictEqual(p.default.value, 42);
    });

    it("allows custom boolean scalar to have a default value", async () => {
      const { S, M } = await runner.compile(`
      @test scalar S extends boolean;
      @test model M { p?: S = true; }
    `);

      strictEqual(S.kind, "Scalar" as const);
      strictEqual(M.kind, "Model" as const);
      const p = M.properties.get("p");
      ok(p);
      expectIdenticalTypes(p.type, S);
      strictEqual(p.default?.kind, "Boolean" as const);
      strictEqual(p.default.value, true);
    });

    it("allows custom string scalar to have a default value", async () => {
      const { S, M } = await runner.compile(`
      @test scalar S extends string;
      @test model M { p?: S = "hello"; }
    `);

      strictEqual(S.kind, "Scalar" as const);
      strictEqual(M.kind, "Model" as const);
      const p = M.properties.get("p");
      ok(p);
      expectIdenticalTypes(p.type, S);
      strictEqual(p.default?.kind, "String" as const);
      strictEqual(p.default.value, "hello");
    });

    it("does not allow custom numeric scalar to have a default outside range", async () => {
      const diagnostics = await runner.diagnose(`
      namespace SomeNamespace;
      scalar S extends int8;
      model M { p?: S = 9999; }
    `);
      expectDiagnostics(diagnostics, [{ code: "unassignable", message: /9999.*S/ }]);
    });

    it("does not allow non-numeric/boolean/string custom scalar to have a default", async () => {
      const diagnostics = await runner.diagnose(`
      scalar S;
      model M { p?: S = 42; }
    `);
      expectDiagnostics(diagnostics, [{ code: "unassignable", message: /42.*S/ }]);
    });
  });
});
