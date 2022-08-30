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

  it("can project to different targets", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        @projectedName("json", "exp")
        @projectedName("csharp", "ExpireAtCS")
        @test expireAt: int32;
      }
    `)) as { expireAt: ModelProperty };
    const csView = createProjectedNameProgram(runner.program, "csharp");
    const jsonView = createProjectedNameProgram(runner.program, "json");
    strictEqual(csView.getProjectedName(expireAt), "ExpireAtCS");
    strictEqual(jsonView.getProjectedName(expireAt), "exp");
  });

  it("can project a different target on top of a projected one", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        @projectedName("json", "exp")
        @projectedName("csharp", "ExpireAtCS")
        @test expireAt: int32;
      }
    `)) as { expireAt: ModelProperty };
    const csView = createProjectedNameProgram(runner.program, "csharp");
    const jsonView = createProjectedNameProgram(csView.program, "json");
    strictEqual(csView.getProjectedName(expireAt), "ExpireAtCS");
    const expireAtCSProjected = csView.program.projector.projectedTypes.get(expireAt);
    strictEqual(expireAtCSProjected?.kind, "ModelProperty" as const);
    strictEqual(jsonView.getProjectedName(expireAtCSProjected), "exp");
  });
});
