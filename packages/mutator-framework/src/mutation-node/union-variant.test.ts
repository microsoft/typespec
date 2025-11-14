import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of variant types", async () => {
  const { program, Foo, v1 } = await runner.compile(t.code`
      union ${t.union("Foo")} {
        ${t.unionVariant("v1")}: string;
        v2: int32;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const v1Node = subgraph.getNode(v1);
  const stringNode = subgraph.getNode($(program).builtin.string);
  stringNode.mutate();
  expect(stringNode.isMutated).toBe(true);
  expect(v1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(v1Node.mutatedType.type === stringNode.mutatedType).toBeTruthy();
});
