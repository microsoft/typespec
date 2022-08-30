import { strictEqual } from "assert";
import { createProjectedNameProgram, ModelProperty } from "../core/index.js";
import { BasicTestRunner, createTestRunner } from "../testing/index.js";

describe("compiler: projected-names", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("@projectName updates the name when runnning projection", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        @projectedName("json", "exp")
        @test expireAt: int32;
      }
    `)) as { expireAt: ModelProperty };
    const projectedView = createProjectedNameProgram(runner.program, "json");
    strictEqual(projectedView.getProjectedName(expireAt), "exp");
  });

  it("@projectName doesn't affect a different target", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        @projectedName("json", "exp")
        @test expireAt: int32;
      }
    `)) as { expireAt: ModelProperty };
    const projectedView = createProjectedNameProgram(runner.program, "csharp");
    strictEqual(projectedView.getProjectedName(expireAt), "expireAt");
  });
});
