import type { Tuple } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";
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
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const propNode = engine.getMutationNode(prop);
  const barNode = engine.getMutationNode(Bar);
  fooNode.connectProperty(propNode);
  const tupleType = prop.type as Tuple;
  const tupleNode = engine.getMutationNode(tupleType);
  propNode.connectType(tupleNode);
  tupleNode.connectElement(barNode, 0);
  barNode.mutate();
  expect(barNode.isMutated).toBe(true);
  expect(propNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect((propNode.mutatedType.type as Tuple).values[0] === barNode.mutatedType).toBeTruthy();
  expect((propNode.mutatedType.type as Tuple).values[1] === $(program).builtin.string).toBeTruthy();
});
