import { beforeEach, describe, expect, it } from "vitest";
import { mutateSubgraph, Mutator, MutatorFlow } from "../../src/experimental/index.js";
import { Model } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { BasicTestRunner, TestHost } from "../../src/testing/types.js";

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
    const mutator: Mutator = {
      name: "test",
      Model: {
        filter: () => {
          return MutatorFlow.DoNotRecurse;
        },
        mutate: (sourceType, clone) => {
          clone.properties.delete("x");
        },
      },
    };
    const mutated = mutateSubgraph(
      runner.program,
      [mutator],
      // [Mutators.Visibility.update, Mutators.JSONMergePatch],
      Foo,
    );

    const mutatedModel = mutated.type as Model;
    expect(mutatedModel.properties.size).toBe(1);
    expect(mutatedModel.properties.get("x")).toBeUndefined();
    expect(mutatedModel.properties.get("y")).toBeDefined();
  });
});
