import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
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
  expectTypeEquals(fooNode.sourceType, fooNode.mutatedType);
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
  expectTypeEquals(fooNode.sourceType, fooNode.mutatedType);
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

it("clones synthetic mutation nodes", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const propNode = engine.getMutationNode(prop);
  fooNode.connectProperty(propNode);

  const model = $(program).model.create({
    name: "Testing",
    properties: {},
  });

  const typeNode = engine.getMutationNode(model, { isSynthetic: true });
  propNode.connectType(typeNode);

  // the type isn't mutated
  expect(typeNode.isMutated).toBe(false);

  // but things referencing it are...
  expect(propNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);

  // we haven't mutated anything yet.
  expect(propNode.mutatedType.type === model).toBe(true);

  typeNode.mutate();
  expect(typeNode.isMutated).toBe(true);
  expect(propNode.mutatedType.type === model).toBe(false);
  expect(propNode.mutatedType.type === typeNode.mutatedType).toBe(true);
});
