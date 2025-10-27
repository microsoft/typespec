import type { Model, Type } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";

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
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(Foo.properties.get("prop")!);
  propNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.properties.get("prop") === propNode.mutatedType).toBe(true);
});

it("handles deletion of properties", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(Foo.properties.get("prop")!);
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
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(Foo.properties.get("prop")!);
  propNode.mutate((clone) => (clone.name = "propRenamed"));
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.mutatedType.properties.get("prop") === undefined).toBe(true);
  expect(fooNode.mutatedType.properties.get("propRenamed") === propNode.mutatedType).toBe(true);
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
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);

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
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);

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
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);

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

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);
  const bazPropNode = subgraph.getNode(bazProp);

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

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);

  fooNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(barNode.isMutated).toBe(true);
});
