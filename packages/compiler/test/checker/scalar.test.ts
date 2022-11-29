import { strictEqual } from "assert";
import { BasicTestRunner, createTestHost, createTestWrapper } from "../../testing/index.js";

describe("compiler: models", () => {
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
});
