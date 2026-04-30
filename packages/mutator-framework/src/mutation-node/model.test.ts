import type { Model, Type } from "@typespec/compiler";
import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of properties", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const propNode = engine.getMutationNode(Foo.properties.get("prop")!);
  fooNode.connectProperty(propNode);
  propNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expectTypeEquals(fooNode.mutatedType.properties.get("prop")!, propNode.mutatedType);
});

it("handles mutation of properties lazily", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      prop: string;
    }
  `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.mutate();

  const propNode = engine.getMutationNode(Foo.properties.get("prop")!);
  fooNode.connectProperty(propNode);
  expect(fooNode.isMutated).toBe(true);
  expect(propNode.isMutated).toBe(true);
  expectTypeEquals(fooNode.mutatedType.properties.get("prop")!, propNode.mutatedType);
});

it("handles deletion of properties", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const propNode = engine.getMutationNode(Foo.properties.get("prop")!);
  fooNode.connectProperty(propNode);
  propNode.delete();
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.properties.get("prop")).toBeUndefined();
});

it("handles mutation of properties with name change", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const propNode = engine.getMutationNode(Foo.properties.get("prop")!);
  fooNode.connectProperty(propNode);
  propNode.mutate((clone) => (clone.name = "propRenamed"));
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.properties.get("prop")).toBeUndefined();
  expectTypeEquals(fooNode.mutatedType.properties.get("propRenamed")!, propNode.mutatedType);
});

it("handles mutation of base models", async () => {
  const { Foo, Bar, program } = await runner.compile(t.code`
      model ${t.model("Foo")} extends Bar {
        barProp: string;
      }

      model ${t.model("Bar")} {
        bazProp: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  fooNode.connectBase(barNode);
  barNode.mutate();
  expect(barNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.baseModel === barNode.mutatedType).toBeTruthy();
});

it("handles deletion of base models", async () => {
  const { Foo, Bar, program } = await runner.compile(t.code`
      model ${t.model("Foo")} extends Bar {
        barProp: string;
      }

      model ${t.model("Bar")} {
        bazProp: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  fooNode.connectBase(barNode);

  barNode.delete();
  expect(barNode.isDeleted).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.baseModel).toBeUndefined();
});

it("handles mutation of indexers", async () => {
  const { Foo, Bar, program } = await runner.compile(t.code`
      model ${t.model("Foo")} is Record<Bar> {};
      model ${t.model("Bar")} {
        bazProp: string;
      }
    `);
  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  fooNode.connectIndexerValue(barNode);

  barNode.mutate();
  expect(barNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect((fooNode.mutatedType.indexer?.value as Type) === barNode.mutatedType).toBeTruthy();
});

it("handles mutation of arrays", async () => {
  const { Foo, Bar, bazProp, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {};
      model ${t.model("Bar")} {
        ${t.modelProperty("bazProp")}: Foo[];
      }
    `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  const bazPropNode = engine.getMutationNode(bazProp);
  barNode.connectProperty(bazPropNode);
  const arrayType = bazProp.type as Model;
  const arrayNode = engine.getMutationNode(arrayType);
  bazPropNode.connectType(arrayNode);
  arrayNode.connectIndexerValue(fooNode);

  fooNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(barNode.isMutated).toBe(true);
  expect(bazPropNode.isMutated).toBe(true);
  expect(
    (bazPropNode.mutatedType.type as Model).indexer!.value === fooNode.mutatedType,
  ).toBeTruthy();
});

it("handles circular models", async () => {
  const { Foo, Bar, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        bar: Bar;
      };
      model ${t.model("Bar")} {
        foo: Foo;
      }
    `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const barNode = engine.getMutationNode(Bar);
  const fooPropBar = engine.getMutationNode(Foo.properties.get("bar")!);
  const barPropFoo = engine.getMutationNode(Bar.properties.get("foo")!);
  fooNode.connectProperty(fooPropBar);
  fooPropBar.connectType(barNode);
  barNode.connectProperty(barPropFoo);
  barPropFoo.connectType(fooNode);

  fooNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(barNode.isMutated).toBe(true);
});
