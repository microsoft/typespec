import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of base scalars", async () => {
  const { program, Base, Derived } = await runner.compile(t.code`
      scalar ${t.scalar("Base")};
      scalar ${t.scalar("Derived")} extends Base;
    `);
  const engine = getEngine(program);
  const baseNode = engine.getMutationNode(Base);
  const derivedNode = engine.getMutationNode(Derived);
  derivedNode.connectBaseScalar(baseNode);

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
  const engine = getEngine(program);
  const baseNode = engine.getMutationNode(Base);
  const derivedNode = engine.getMutationNode(Derived);
  derivedNode.connectBaseScalar(baseNode);

  const replacedNode = baseNode.replace($(program).builtin.string);
  expect(replacedNode.isMutated).toBe(true);
  expect(baseNode.isReplaced).toBe(true);

  // derived node is updated
  expect(derivedNode.isMutated).toBe(true);
  expectTypeEquals(derivedNode.mutatedType.baseScalar!, replacedNode.sourceType);
});
