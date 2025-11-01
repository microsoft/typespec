import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of members", async () => {
  const { program, Foo, a } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("a")};
        b;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const aNode = subgraph.getNode(a);
  aNode.mutate((clone) => (clone.name = "aRenamed"));
  expect(aNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("a") === undefined).toBeTruthy();
  expect(fooNode.mutatedType.members.get("aRenamed") === aNode.mutatedType).toBeTruthy();
});
