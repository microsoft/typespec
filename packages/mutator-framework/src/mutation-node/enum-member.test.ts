import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of member values", async () => {
  const { program, Foo, member1 } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("member1")}: "value1";
        member2: "value2";
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const member1Node = subgraph.getNode(member1);
  member1Node.mutate((clone) => (clone.value = "value1Renamed"));
  expect(member1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("member1") === member1Node.mutatedType).toBe(true);
  expect(member1Node.mutatedType.value).toBe("value1Renamed");
});

it("handles mutation of member with numeric values", async () => {
  const { program, Foo, member1 } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("member1")}: 1;
        member2: 2;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const member1Node = subgraph.getNode(member1);
  member1Node.mutate((clone) => (clone.value = 100));
  expect(member1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(member1Node.mutatedType.value).toBe(100);
});
