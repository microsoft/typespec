import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getSubgraph } from "../../test/utils.js";

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
  const subgraph = getSubgraph(program);
  const propNode = subgraph.getNode(prop);
  const stringNode = subgraph.getNode($(program).builtin.string);
  stringNode.mutate();
  expect(propNode.isMutated).toBe(true);
  expect(propNode.mutatedType.type === stringNode.mutatedType).toBe(true);
});

it("handles mutating a reference", async () => {
  const { Foo, Bar, prop, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: Bar;
      };
      model ${t.model("Bar")} {}
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(prop);
  const barPrime = subgraph.getReferenceNode(prop);

  // initially the source type is just Bar.
  expect(barPrime.sourceType === Bar).toBe(true);

  barPrime.mutate();
  expect(fooNode.isMutated).toBe(true);
  expect(propNode.isMutated).toBe(true);
  expect(barPrime.isMutated).toBe(true);
  expect(fooNode.mutatedType.properties.get("prop")!.type === barPrime.mutatedType).toBeTruthy();

  const barNode = subgraph.getNode(Bar);
  barNode.mutate();
  expect(barNode.isMutated).toBe(true);
  expect(barPrime.isMutated).toBe(true);
  // the mutated type doesn't change here.
  expect(fooNode.mutatedType.properties.get("prop")!.type === barPrime.mutatedType).toBeTruthy();
});

it.only("handles replacing the model reference", async () => {
  const { Foo, Bar, prop, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        ${t.modelProperty("prop")}: Bar;
      };
      model ${t.model("Bar")} {}
    `);
  const tk = $(program);
  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const propNode = subgraph.getNode(prop);
  const barPrime = subgraph.getReferenceNode(prop);
  const unionType = tk.union.create({
    variants: [
      tk.unionVariant.create({ type: tk.builtin.string }),
      tk.unionVariant.create({ type: Bar }),
    ],
  });

  const replacedBarPrime = barPrime.replace(unionType);

  // the subgraph now returns the new reference node
  expect(subgraph.getReferenceNode(prop) === replacedBarPrime).toBe(true);

  // foo and prop are marked mutated, barPrime is replaced
  expect(fooNode.isMutated).toBe(true);
  expect(propNode.isMutated).toBe(true);
  expect(barPrime.isReplaced).toBe(true);

  // prop's type is the replaced type
  expect(tk.union.is(propNode.mutatedType.type)).toBe(true);
  expect(
    fooNode.mutatedType!.properties.get("prop")!.type === replacedBarPrime.mutatedType,
  ).toBeTruthy();
});

it("handles mutating a reference to a reference", async () => {
  const { myString, Foo, fprop, Bar, program } = await runner.compile(t.code`
      scalar ${t.scalar("myString")} extends string;
      model ${t.model("Foo")} {
        ${t.modelProperty("fprop")}: myString;
      };
      model ${t.model("Bar")} {
        bprop: Foo.fprop;
      }
    `);

  const subgraph = getSubgraph(program);
  const fooNode = subgraph.getNode(Foo);
  const barNode = subgraph.getNode(Bar);
  const myStringNode = subgraph.getNode(myString);

  myStringNode.mutate();
  expect(myStringNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(barNode.isMutated).toBe(true);

  // Foo.prop's type is the mutated myString
  expect(
    fooNode.mutatedType.properties.get("fprop")!.type === myStringNode.mutatedType,
  ).toBeTruthy();

  // Bar.prop's type is the mutated Foo.prop
  expect(
    barNode.mutatedType.properties.get("bprop")!.type ===
      fooNode.mutatedType.properties.get("fprop")!,
  ).toBeTruthy();

  const fpropRefNode = subgraph.getReferenceNode(fprop);
  fpropRefNode.mutate();
  expect(fpropRefNode.isMutated).toBe(true);
  expect(
    fooNode.mutatedType.properties.get("fprop")!.type === fpropRefNode.mutatedType,
  ).toBeTruthy();

  // Bar.bprop references the mutated type (though is the same reference since fprop was already mutated)
  expect(
    barNode.mutatedType.properties.get("bprop")!.type ===
      fooNode.mutatedType.properties.get("fprop")!,
  ).toBeTruthy();
});
