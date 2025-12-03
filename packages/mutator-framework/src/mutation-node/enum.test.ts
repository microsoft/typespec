import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of members", async () => {
  const { program, Foo, member1 } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("member1")};
        member2;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const member1Node = subgraph.getNode(member1);
  member1Node.mutate();
  expect(member1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("member1") === member1Node.mutatedType).toBe(true);
});

it("handles mutation of members with name change", async () => {
  const { program, Foo, member1 } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("member1")};
        member2;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const member1Node = subgraph.getNode(member1);
  member1Node.mutate((clone) => (clone.name = "member1Renamed"));
  expect(member1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("member1")).toBeUndefined();
  expect(fooNode.mutatedType.members.get("member1Renamed") === member1Node.mutatedType).toBe(true);
});

it("handles deletion of members", async () => {
  const { program, Foo, member1 } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("member1")};
        member2;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const member1Node = subgraph.getNode(member1);
  member1Node.delete();
  expect(member1Node.isDeleted).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("member1")).toBeUndefined();
  expect(fooNode.mutatedType.members.size).toBe(1);
});
