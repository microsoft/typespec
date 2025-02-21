// TODO: find better name for file
import { beforeEach, expect, it } from "vitest";
import { mutateSubgraph, Mutator } from "../../src/experimental/mutators.js";
import { getTypeName, Model } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { BasicTestRunner, TestHost } from "../../src/testing/types.js";

let host: TestHost;
let runner: BasicTestRunner;

beforeEach(async () => {
  host = await createTestHost();
  runner = createTestWrapper(host);
});

it("works", async () => {
  const code = `
      @test model A {
        b: B;
      }
      model B {}
    `;

  const { A } = (await runner.compile(code)) as { A: Model };
  const mutator: Mutator = {
    name: "test",
    Model: {
      // filter: () => MutatorFlow.DoNotRecur,
      mutate: (_model, clone) => {},
    },
  };
  const { realm } = mutateSubgraph(runner.program, [mutator], A);
  expect([...realm!.types].map((x) => getTypeName(x))).toEqual(["A", "A.b", "B"]);
});
