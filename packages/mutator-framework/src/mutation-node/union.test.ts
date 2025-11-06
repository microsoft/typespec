import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of variants", async () => {
  const { program, Foo, v1 } = await runner.compile(t.code`
      union ${t.union("Foo")} {
        ${t.unionVariant("v1")}: string;
        v2: int32;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const v1Node = subgraph.getNode(v1);
  v1Node.mutate((clone) => (clone.name = "v1Renamed"));
  expect(v1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.variants.get("v1") === undefined).toBeTruthy();
  expect(fooNode.mutatedType.variants.get("v1Renamed") === v1Node.mutatedType).toBeTruthy();
});
