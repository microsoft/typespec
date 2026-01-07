import { Tester } from "#test/test-host.js";
import { computed } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it, vi } from "vitest";
import { SCCSet, type NestedArray, type SCCComponent } from "./scc-set.js";
import { typeDependencyConnector } from "./type-connector.js";

describe("SCCSet", () => {
  it("topologically orders items", () => {
    const edges = new Map<string, string[]>([
      ["model", ["serializer"]],
      ["serializer", ["helpers"]],
      ["helpers", []],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    set.add("model");
    set.add("serializer");
    set.add("helpers");

    expect([...set.items]).toEqual(["helpers", "serializer", "model"]);
    expect(componentValues(set)).toEqual(["helpers", "serializer", "model"]);
  });

  it("groups strongly connected components", () => {
    const edges = new Map<string, string[]>([
      ["a", ["b"]],
      ["b", ["a", "c"]],
      ["c", []],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    set.add("a");
    set.add("b");
    set.add("c");

    expect(componentValues(set)).toEqual(["c", ["a", "b"]]);
    expect(set.items).toEqual(["c", "a", "b"]);
  });

  it("defers placeholders until added", () => {
    const edges = new Map<string, string[]>([
      ["root", ["child"]],
      ["child", []],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? []);

    set.add("root");
    expect(set.items).toEqual(["root"]);
    expect(componentValues(set)).toEqual(["root"]);

    set.add("child");
    expect(set.items).toEqual(["child", "root"]);
    expect(componentValues(set)).toEqual(["child", "root"]);
  });

  it("surfaces reachable nodes when requested", () => {
    const edges = new Map<string, string[]>([
      ["root", ["child"]],
      ["child", ["leaf"]],
      ["leaf", []],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? [], { includeReachable: true });
    set.add("root");

    expect(set.items).toEqual(["leaf", "child", "root"]);
    expect(componentValues(set)).toEqual(["leaf", "child", "root"]);
  });

  it("mutates arrays in place when adding", () => {
    const edges = new Map<string, string[]>([["only", []]]);
    const connector = vi.fn((item: string) => edges.get(item) ?? []);

    const set = new SCCSet(connector);
    set.add("only");

    const firstItems = set.items;
    const firstComponents = set.components;

    expect(set.items).toBe(firstItems);
    expect(set.components).toBe(firstComponents);
    expect(connector).toHaveBeenCalledTimes(1);

    set.add("late");
    expect(connector).toHaveBeenCalledTimes(2);
    expect(set.items).toBe(firstItems);
    expect(set.components).toBe(firstComponents);
    expect(firstItems).toEqual(["only", "late"]);
    expect(componentValuesFrom(firstComponents)).toEqual(["only", "late"]);
  });

  it("notifies computed observers", () => {
    const edges = new Map<string, string[]>([
      ["model", ["serializer"]],
      ["serializer", ["helpers"]],
      ["helpers", []],
      ["cycle-a", ["cycle-b"]],
      ["cycle-b", ["cycle-a"]],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    const observedItems = computed(() => [...set.items]);
    const observedComponents = computed(() => componentValues(set));
    const observedCycle = computed(() => {
      const cycle = set.components.find((component) => Array.isArray(component.value));
      if (!cycle || !Array.isArray(cycle.value)) {
        return [];
      }
      return [...cycle.value];
    });

    expect(observedItems.value).toEqual([]);
    expect(observedComponents.value).toEqual([]);
    expect(observedCycle.value).toEqual([]);

    set.add("model");
    expect(observedItems.value).toEqual(["model"]);
    expect(observedComponents.value).toEqual(["model"]);

    set.add("serializer");
    expect(observedItems.value).toEqual(["serializer", "model"]);
    expect(observedComponents.value).toEqual(["serializer", "model"]);

    set.add("helpers");
    expect(observedItems.value).toEqual(["helpers", "serializer", "model"]);
    expect(observedComponents.value).toEqual(["helpers", "serializer", "model"]);

    set.add("cycle-a");
    expect(observedCycle.value).toEqual([]);

    set.add("cycle-b");
    expect(observedCycle.value).toEqual(["cycle-a", "cycle-b"]);
  });

  it("orders dependent nodes even when added out of order", () => {
    const edges = new Map<string, string[]>([
      ["Leaf", []],
      ["Indexed", ["Record"]],
      ["Record", ["Leaf"]],
      ["Base", ["Leaf"]],
      ["Derived", ["Base", "Indexed"]],
      ["CycleA", ["CycleB"]],
      ["CycleB", ["CycleA"]],
    ]);

    const insertionOrder = ["Derived", "Indexed", "Leaf", "Base", "CycleA", "CycleB"];
    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    for (const item of insertionOrder) {
      set.add(item);
    }

    expect([...set.items]).toEqual(["Leaf", "Indexed", "Base", "Derived", "CycleA", "CycleB"]);
    expect(componentValues(set)).toEqual([
      "Leaf",
      "Indexed",
      "Base",
      "Derived",
      ["CycleA", "CycleB"],
    ]);
  });

  it("batch adds nodes and recomputes once", () => {
    const edges = new Map<string, string[]>([
      ["Leaf", []],
      ["Indexed", ["Record"]],
      ["Record", ["Leaf"]],
      ["Base", ["Leaf"]],
      ["Derived", ["Base", "Indexed"]],
      ["CycleA", ["CycleB"]],
      ["CycleB", ["CycleA"]],
    ]);

    const insertionOrder = ["Derived", "Indexed", "Leaf", "Base", "CycleA", "CycleB"];
    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    set.addAll(insertionOrder);

    expect([...set.items]).toEqual(["Leaf", "Indexed", "Base", "Derived", "CycleA", "CycleB"]);
    expect(componentValues(set)).toEqual([
      "Leaf",
      "Indexed",
      "Base",
      "Derived",
      ["CycleA", "CycleB"],
    ]);
  });

  it("exposes component connections", () => {
    const edges = new Map<string, string[]>([
      ["Leaf", []],
      ["Base", ["Leaf"]],
      ["Indexed", ["Leaf"]],
      ["Derived", ["Base", "Indexed"]],
      ["CycleA", ["CycleB"]],
      ["CycleB", ["CycleA"]],
    ]);

    const set = new SCCSet<string>((item) => edges.get(item) ?? []);
    set.addAll(["Derived", "Base", "Indexed", "Leaf", "CycleA", "CycleB"]);

    const getSingleton = (name: string) =>
      set.components.find((component) => component.value === name)!;
    const format = (components: Iterable<SCCComponent<string>>) =>
      Array.from(components, (component) =>
        Array.isArray(component.value) ? component.value.join(",") : component.value,
      ).sort();

    const derived = getSingleton("Derived");
    const base = getSingleton("Base");
    const indexed = getSingleton("Indexed");
    const leaf = getSingleton("Leaf");
    const cycle = set.components.find((component) => Array.isArray(component.value))!;

    expect(format(derived.references)).toEqual(["Base", "Indexed"]);
    expect(format(base.references)).toEqual(["Leaf"]);
    expect(format(base.referencedBy)).toEqual(["Derived"]);
    expect(format(indexed.referencedBy)).toEqual(["Derived"]);
    expect(format(leaf.referencedBy)).toEqual(["Base", "Indexed"]);
    expect(format(cycle.references)).toEqual([]);
    expect(format(cycle.referencedBy)).toEqual([]);
  });

  it("orders TypeSpec models via connector", async () => {
    const tester = await Tester.createInstance();
    const { Leaf, Indexed, Base, Derived, CycleA, CycleB } = await tester.compile(
      t.code`
        @test model ${t.model("Leaf")} {
          value: string;
        }

        @test model ${t.model("Indexed")} extends Record<Leaf> {}

        @test model ${t.model("Base")} {
          leaf: Leaf;
        }

        @test model ${t.model("Derived")} extends Base {
          payload: Indexed;
        }

        @test model ${t.model("CycleA")} {
          next: CycleB;
        }

        @test model ${t.model("CycleB")} {
          prev: CycleA;
        }
      `,
    );

    const models = [Derived, Indexed, Leaf, Base, CycleA, CycleB] as Type[];
    const set = new SCCSet<Type>(typeDependencyConnector);
    for (const type of models) {
      set.add(type);
    }

    const itemNames = set.items.map(getTypeLabel);
    expect(itemNames).toEqual(["Leaf", "Indexed", "Base", "Derived", "CycleA", "CycleB"]);

    const componentNames = set.components.map(formatComponent);
    expect(componentNames).toEqual(["Leaf", "Indexed", "Base", "Derived", ["CycleA", "CycleB"]]);
  });
});

function componentValues<T>(set: SCCSet<T>): NestedArray<T>[] {
  return componentValuesFrom(set.components);
}

function componentValuesFrom<T>(components: readonly SCCComponent<T>[]): NestedArray<T>[] {
  return components.map((component) => component.value);
}

function getTypeLabel(type: Type): string {
  if ("name" in type && typeof type.name === "string" && type.name) {
    return type.name;
  }
  return type.kind;
}

type ComponentLabel = string | string[];

function formatComponent(component: SCCComponent<Type>): ComponentLabel {
  return formatComponentValue(component.value);
}

function formatComponentValue(componentValue: NestedArray<Type>): ComponentLabel {
  if (Array.isArray(componentValue)) {
    return (componentValue as Type[]).map(getTypeLabel);
  }
  return getTypeLabel(componentValue);
}
