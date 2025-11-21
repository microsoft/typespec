import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("Subgraph#getNode returns the same node for the same type when called", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode1 = subgraph.getNode(Foo);
  const fooNode2 = subgraph.getNode(Foo);
  expect(fooNode1 === fooNode2).toBe(true);
});

it("Creates the same node when constructing the subgraph and coming back to the same type", async () => {
  const { Foo, Bar, Baz, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string; 
      }

      model ${t.model("Bar")} {
        foo: Foo;
      }

      model ${t.model("Baz")} {
        foo: Foo;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  subgraph.getNode(Bar);
  subgraph.getNode(Baz);

  expect(fooNode.inEdges.size).toBe(2);
});

it("starts with the mutatedType and sourceType being the same", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  expect(fooNode.isMutated).toBe(false);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(true);
});

it("clones the source type when mutating and sets isMutated to true", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: string;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  expect(fooNode.isMutated).toBe(false);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(true);
  fooNode.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(fooNode.sourceType === fooNode.mutatedType).toBe(false);
  expect(fooNode.sourceType.name).toEqual(fooNode.mutatedType.name);
});

it("invokes whenMutated callbacks when mutating", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        prop: Bar;
      }

      model ${t.model("Bar")} {
        prop: string;
      }
    `);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Foo);
  let called = false;
  fooNode.whenMutated((mutatedType) => {
    called = true;
    expect(mutatedType).toBe(fooNode.mutatedType);
  });
  expect(called).toBe(false);
  barNode.mutate();
  expect(called).toBe(true);
});
