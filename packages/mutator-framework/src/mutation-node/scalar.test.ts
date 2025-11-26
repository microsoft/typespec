import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});
it("handles mutation of base scalars", async () => {
  const { program, Base, Derived } = await runner.compile(t.code`
      scalar ${t.scalar("Base")};
      scalar ${t.scalar("Derived")} extends Base;
    `);
  const subgraph = getSubgraph(program);
  const baseNode = subgraph.getNode(Base);
  const derivedNode = subgraph.getNode(Derived);

  baseNode.mutate();
  expect(baseNode.isMutated).toBe(true);
  expect(derivedNode.isMutated).toBe(true);
  expect(derivedNode.mutatedType.baseScalar === baseNode.mutatedType).toBeTruthy();
});

it("handles replacement of scalars", async () => {
  const { program, Base, Derived } = await runner.compile(t.code`
      scalar ${t.scalar("Base")};
      scalar ${t.scalar("Derived")} extends Base;
    `);
  const subgraph = getSubgraph(program);
  const baseNode = subgraph.getNode(Base);
  const derivedNode = subgraph.getNode(Derived);

  const replacedNode = baseNode.replace($(program).builtin.string);
  expect(replacedNode.isMutated).toBe(true);
  expect(baseNode.isReplaced).toBe(true);

  // subgraph is updated
  expect(replacedNode === subgraph.getNode(Base)).toBe(true);

  // derived node is updated
  expect(derivedNode.isMutated).toBe(true);
  expect(derivedNode.mutatedType.baseScalar === replacedNode.sourceType).toBe(true);
});
