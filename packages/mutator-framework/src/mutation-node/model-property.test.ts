import type { Model } from "@typespec/compiler";
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

it("handles replacing multiple properties", async () => {
  const { Foo, one, two, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("one")}: string;
      ${t.modelProperty("two")}: string;
    }
  `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const oneNode = engine.getMutationNode(one);
  const twoNode = engine.getMutationNode(two);
  fooNode.connectProperty(oneNode);
  fooNode.connectProperty(twoNode);

  const r1 = $(program).modelProperty.create({
    name: "replacement",
    type: $(program).builtin.string,
  });
  const r2 = $(program).modelProperty.create({
    name: "replacement2",
    type: $(program).builtin.string,
  });
  oneNode.replace(r1);
  twoNode.replace(r2);

  expect(fooNode.mutatedType.properties.size).toBe(2);
  expect(fooNode.mutatedType.properties.get("replacement")).toBeDefined();
  expect(fooNode.mutatedType.properties.get("replacement2")).toBeDefined();
});

it("handles replacing properties and mutating their types", async () => {
  const { Foo, Bar, one, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("one")}: Bar;
    }

    model ${t.model("Bar")} {}
  `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const oneNode = engine.getMutationNode(one);
  const barNode = engine.getMutationNode(Bar);
  fooNode.connectProperty(oneNode);
  oneNode.connectType(barNode);

  const r1 = $(program).modelProperty.create({
    name: "replacement",
    type: Bar,
  });
  oneNode.replace(r1);

  barNode.mutate();
  barNode.mutatedType.name = "Rebar";

  expect(fooNode.mutatedType.properties.size).toBe(1);
  expect(fooNode.mutatedType.properties.get("replacement")).toBeDefined();
  expect((fooNode.mutatedType.properties.get("replacement")!.type as Model).name).toBe("Rebar");
});

it("handles replacing properties that have already been mutated", async () => {
  const { Foo, one, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("one")}: string;
    }
  `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const oneNode = engine.getMutationNode(one);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  oneNode.connectType(stringNode);
  const r1 = $(program).modelProperty.create({
    name: "replacement",
    type: $(program).builtin.string,
  });
  const newNode = oneNode.replace(r1);
  fooNode.connectProperty(newNode as any);
  expect(fooNode.mutatedType.properties.size).toBe(1);
  expect(fooNode.mutatedType.properties.get("replacement")).toBeDefined();
});
