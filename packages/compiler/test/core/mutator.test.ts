import { beforeEach, describe, it } from "vitest";
import { Mutators, mutateSubgraph } from "../../src/core/mutator.js";
import { Model } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { BasicTestRunner, TestHost } from "../../src/testing/types.js";

describe("compiler: Mutators", () => {
  let host: TestHost;
  let runner: BasicTestRunner;

  beforeEach(async () => {
    host = await createTestHost();
    runner = createTestWrapper(host);
  });

  describe("Visibility", () => {
    it("works", async () => {
      const code = `
      @test model Foo {
        @visibility("create") x: string;
        y: string;
      };
    `;

      const { Foo } = (await runner.compile(code)) as { Foo: Model };
      const mutated = mutateSubgraph(
        runner.program,
        [Mutators.Visibility.update, Mutators.JSONMergePatch],
        Foo
      );
      console.log([...(mutated.type as Model).properties]);
    });
  });
});
