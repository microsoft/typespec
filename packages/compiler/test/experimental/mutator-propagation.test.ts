// TODO: find better name for file
import { expect, it } from "vitest";
import { mutateSubgraph, Mutator } from "../../src/experimental/mutators.js";
import { getTypeName } from "../../src/index.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

it("works", async () => {
  const { A, program } = await Tester.compile(t.code`
      model ${t.model("A")} {
        b: B;
      }
      model B {}
    `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      // filter: () => MutatorFlow.DoNotRecur,
      mutate: (_model, clone) => {},
    },
  };
  const { realm } = mutateSubgraph(program, [mutator], A);
  expect([...realm!.types].map((x) => getTypeName(x))).toEqual(["A", "A.b", "B"]);
});
