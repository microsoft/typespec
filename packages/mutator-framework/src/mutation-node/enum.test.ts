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
  aNode.mutate();
  expect(aNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("a") === aNode.mutatedType).toBe(true);
});

it("handles mutation of members with name change", async () => {
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
  expect(fooNode.mutatedType.members.get("a")).toBeUndefined();
  expect(fooNode.mutatedType.members.get("aRenamed") === aNode.mutatedType).toBe(true);
});

it("handles deletion of members", async () => {
  const { program, Foo, a } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("a")};
        b;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const aNode = subgraph.getNode(a);
  aNode.delete();
  expect(aNode.isDeleted).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.members.get("a")).toBeUndefined();
  expect(fooNode.mutatedType.members.size).toBe(1);
});
