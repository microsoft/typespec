import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("Engine#getMutationNode returns the same node for the same type when called", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode1 = engine.getMutationNode(Foo);
  const fooNode2 = engine.getMutationNode(Foo);
  expect(fooNode1 === fooNode2).toBe(true);
});

it("starts with the mutatedType and sourceType being the same", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  expect(fooNode.isMutated).toBe(false);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(true);
});

it("clones the source type when mutating and sets isMutated to true", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  expect(fooNode.isMutated).toBe(false);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(true);
  fooNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(false);
  expect(fooNode.sourceType.name).toEqual(fooNode.mutatedType.name);
});

it("invokes whenMutated callbacks when mutating", async () => {
  const { Foo, Bar, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: Bar;
      }

      model ${t.model("Bar")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  const fooProp = engine.getMutationNode(Foo.properties.get("prop")!);
  fooNode.connectProperty(fooProp);
  fooProp.connectType(barNode);
  let called = false;
  fooNode.whenMutated((mutatedType) => {
    called = true;
    expect(mutatedType).toBe(fooNode.mutatedType);
  });
  expect(called).toBe(false);
  barNode.mutate();
  expect(called).toBe(true);
});
