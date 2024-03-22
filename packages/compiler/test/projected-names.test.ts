import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { ModelProperty, createProjectedNameProgram, projectProgram } from "../src/core/index.js";
import { BasicTestRunner, createTestRunner } from "../src/testing/index.js";

describe("compiler: projected-names", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  it("@projectName updates the name when running projection", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        #suppress "deprecated" "for testing"
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
        #suppress "deprecated" "for testing"
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
        #suppress "deprecated" "for testing"
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
        #suppress "deprecated" "for testing"
        @projectedName("json", "exp")
        @projectedName("csharp", "ExpireAtCS")
        @test expireAt: int32;
      }
    `)) as { expireAt: ModelProperty };
    const csView = createProjectedNameProgram(runner.program, "csharp");
    const jsonView = createProjectedNameProgram(runner.program, "json");
    strictEqual(csView.getProjectedName(expireAt), "ExpireAtCS");
    const expireAtCSProjected = csView.program.projector.projectedTypes.get(expireAt);
    strictEqual(expireAtCSProjected?.kind, "ModelProperty" as const);
    strictEqual(jsonView.getProjectedName(expireAtCSProjected), "exp");
  });

  it("if another projection renamed the TypeSpec type it should be taken into account by getProjectedName", async () => {
    const { expireAt } = (await runner.compile(`
      model Foo {
        @test expireAt: int32;
      }

      #suppress "projections-are-experimental"
      projection Foo#v {
        to {
          self::properties::forEach((p) => {
            self::renameProperty(p::name, "actualNameAtThisVersion");
          });
        }
      }
    `)) as { expireAt: ModelProperty };
    const updatedProgram = projectProgram(runner.program, [
      {
        projectionName: "v",
        arguments: [],
      },
    ]);
    const jsonView = createProjectedNameProgram(updatedProgram, "json");
    const expireAtProjected = updatedProgram.projector.projectedTypes.get(expireAt);
    strictEqual(expireAtProjected?.kind, "ModelProperty" as const);
    strictEqual(expireAtProjected?.name, "actualNameAtThisVersion");
    strictEqual(jsonView.getProjectedName(expireAtProjected), "actualNameAtThisVersion");
  });

  it("projectedName overrides a previous renaming", async () => {
    const { expireAt, renamedProperty } = (await runner.compile(`
      model Foo {
        #suppress "deprecated" "for testing"
        @projectedName("json", "jsonExpireAt") @test expireAt: int32;
        #suppress "deprecated" "for testing"
        @projectedName("json", "jsonRenamedProperty") @test renamedProperty: string;
      }

      #suppress "projections-are-experimental"
      projection Foo#v {
        to {
            self::renameProperty("expireAt", "actualNameAtThisVersion");
        }
      }
    `)) as { expireAt: ModelProperty; renamedProperty: ModelProperty };
    const updatedProgram = projectProgram(runner.program, [
      {
        projectionName: "v",
        arguments: [],
      },
    ]);
    const jsonView = createProjectedNameProgram(updatedProgram, "json");
    const expireAtProjected = updatedProgram.projector.projectedTypes.get(expireAt);
    const renamedProjected = updatedProgram.projector.projectedTypes.get(renamedProperty);
    strictEqual(expireAtProjected?.kind, "ModelProperty" as const);
    strictEqual(expireAtProjected?.name, "actualNameAtThisVersion");
    strictEqual(renamedProjected?.kind, "ModelProperty" as const);
    strictEqual(renamedProjected?.name, "renamedProperty");
    strictEqual(jsonView.getProjectedName(expireAtProjected), "jsonExpireAt");
    strictEqual(jsonView.getProjectedName(renamedProjected), "jsonRenamedProperty");
  });
});
