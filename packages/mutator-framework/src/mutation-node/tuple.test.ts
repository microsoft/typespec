import type { Tuple } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of element types", async () => {
  const { program, Foo, prop, Bar } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: [Bar, string];
      }
      model ${t.model("Bar")} {}

    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(prop);
  const barNode = subgraph.getNode(Bar);
  barNode.mutate();
  expect(barNode.isMutated).toBe(true);
  expect(propNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect((propNode.mutatedType.type as Tuple).values[0] === barNode.mutatedType).toBeTruthy();
  expect((propNode.mutatedType.type as Tuple).values[1] === $(program).builtin.string).toBeTruthy();
});
