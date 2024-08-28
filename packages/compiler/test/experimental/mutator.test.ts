import { beforeEach, describe, expect, it } from "vitest";
import { Mutators, mutateSubgraph } from "../../src/experimental/index.js";
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

      const mutatedModel = mutated.type as Model;
      expect(mutatedModel.properties.size).toBe(1);
      expect(mutatedModel.properties.get("x")).toBeUndefined();
      expect(mutatedModel.properties.get("y")).toBeDefined();
    });
  });
});
