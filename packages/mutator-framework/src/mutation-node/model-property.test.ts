import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of property types", async () => {
  const { prop, program } = await runner.compile(t.code`
      model Foo {
        ${t.modelProperty("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  propNode.connectType(stringNode);
  stringNode.mutate();
  expect(propNode.isMutated).toBe(true);
  expectTypeEquals(propNode.mutatedType.type, stringNode.mutatedType);
});

it("updates its model property to the mutated model", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: string;
    }
  `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectProperty(propNode);
  propNode.connectType(stringNode);
  stringNode.mutate();
  expectTypeEquals(fooNode.mutatedType, propNode.mutatedType.model!);
});

it("is deleted when its container model is deleted", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectProperty(propNode);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  propNode.connectType(stringNode);
  fooNode.delete();
  expect(propNode.isDeleted).toBe(true);
});

it("is deleted when its container model is replaced", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectProperty(propNode);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  propNode.connectType(stringNode);
  fooNode.replace($(program).builtin.string);
  expect(propNode.isDeleted).toBe(true);
});

it("can connect to a different mutation key for the type", async () => {
  const { Bar, prop, program } = await runner.compile(t.code`
      model Foo {
        ${t.modelProperty("prop")}: Bar;
      }
        model ${t.model("Bar")} {}
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const barNode = engine.getMutationNode(Bar);

  barNode.mutate();
  expect(propNode.isMutated).toBe(false);

  const barNodeCustom = engine.getMutationNode(Bar);
  propNode.connectType(barNodeCustom);
  barNodeCustom.mutate();
  expect(propNode.isMutated).toBe(true);
  expectTypeEquals(propNode.mutatedType.type, barNodeCustom.mutatedType);
});

it("can connect to an already-mutated node", async () => {
  const { Bar, prop, program } = await runner.compile(t.code`
    model Foo {
      ${t.modelProperty("prop")}: Bar;
    }
      
    model ${t.model("Bar")} {}
  `);
  const engine = getEngine(program);
  const barNode = engine.getMutationNode(Bar);
  barNode.mutate();

  const propNode = engine.getMutationNode(prop);
  propNode.connectType(barNode);
  expect(propNode.isMutated).toBe(true);
  expectTypeEquals(propNode.mutatedType.type, barNode.mutatedType);
});

it("can connect to an already-replaced node", async () => {
  const { Bar, prop, program } = await runner.compile(t.code`
    model Foo {
      ${t.modelProperty("prop")}: Bar;
    }
      
    model ${t.model("Bar")} {}
  `);
  const engine = getEngine(program);
  const barNode = engine.getMutationNode(Bar);
  barNode.replace($(program).builtin.int16);

  const propNode = engine.getMutationNode(prop);
  propNode.connectType(barNode);
  expect(propNode.isMutated).toBe(true);
  expectTypeEquals(propNode.mutatedType.type, $(program).builtin.int16);
});
