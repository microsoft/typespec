import { navigateTypesInNamespace, resolvePath } from "@typespec/compiler";
import { createTester, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, describe, expect, it } from "vitest";
import { buildTypeGraph } from "../../src/mutation-engine/type-graph.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: [],
});

describe("buildTypeGraph", () => {
  let tester: TesterInstance;

  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("produces a namespace containing the given types", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
      }
    `);

    const tk = $(tester.program);
    const foo = TestNs.models.get("Foo")!;
    const graph = buildTypeGraph(tester.program, tk, [foo]);

    expect(graph.globalNamespace.models.get("Foo")).toBe(foo);
  });

  it("sets .namespace on all types to the new namespace", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
        model Bar { value: int32; }
      }
    `);

    const tk = $(tester.program);
    const foo = TestNs.models.get("Foo")!;
    const bar = TestNs.models.get("Bar")!;
    const graph = buildTypeGraph(tester.program, tk, [foo, bar]);

    expect(foo.namespace).toBe(graph.globalNamespace);
    expect(bar.namespace).toBe(graph.globalNamespace);
  });

  it("works with navigateTypesInNamespace", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
        model Bar { value: int32; }
      }
    `);

    const tk = $(tester.program);
    const foo = TestNs.models.get("Foo")!;
    const bar = TestNs.models.get("Bar")!;
    const graph = buildTypeGraph(tester.program, tk, [foo, bar]);

    const visitedModels: string[] = [];
    navigateTypesInNamespace(graph.globalNamespace, {
      model: (m) => visitedModels.push(m.name),
    });

    expect(visitedModels).toContain("Foo");
    expect(visitedModels).toContain("Bar");
  });

  it("includes mutated types in the output", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
      }
    `);

    const tk = $(tester.program);
    const originalFoo = TestNs.models.get("Foo")!;

    const mutatedFoo = tk.type.clone(originalFoo);
    mutatedFoo.name = "FooRenamed";

    const graph = buildTypeGraph(tester.program, tk, [mutatedFoo]);

    expect(graph.globalNamespace.models.get("FooRenamed")).toBe(mutatedFoo);
    expect(mutatedFoo.namespace).toBe(graph.globalNamespace);
  });

  it("excludes types not in the output list", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
        model Bar { value: int32; }
      }
    `);

    const tk = $(tester.program);
    const bar = TestNs.models.get("Bar")!;

    const graph = buildTypeGraph(tester.program, tk, [bar]);

    expect(graph.globalNamespace.models.has("Foo")).toBe(false);
    expect(graph.globalNamespace.models.has("Bar")).toBe(true);
  });

  it("handles all type kinds", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
        enum Status { Active, Inactive }
        union Pet { cat: string, dog: string }
        scalar MyId extends string;
        op doSomething(): void;
      }
    `);

    const tk = $(tester.program);
    const foo = TestNs.models.get("Foo")!;
    const status = TestNs.enums.get("Status")!;
    const pet = TestNs.unions.get("Pet")!;
    const myId = TestNs.scalars.get("MyId")!;
    const doSomething = TestNs.operations.get("doSomething")!;

    const graph = buildTypeGraph(tester.program, tk, [foo, status, pet, myId, doSomething]);

    expect(graph.globalNamespace.models.has("Foo")).toBe(true);
    expect(graph.globalNamespace.enums.has("Status")).toBe(true);
    expect(graph.globalNamespace.unions.has("Pet")).toBe(true);
    expect(graph.globalNamespace.scalars.has("MyId")).toBe(true);
    expect(graph.globalNamespace.operations.has("doSomething")).toBe(true);
  });

  it("preserves decorators on types", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        @doc("A foo model")
        model Foo { name: string; }
      }
    `);

    const tk = $(tester.program);
    const foo = TestNs.models.get("Foo")!;
    const graph = buildTypeGraph(tester.program, tk, [foo]);

    const outputFoo = graph.globalNamespace.models.get("Foo")!;
    expect(outputFoo.decorators.length).toBeGreaterThan(0);
  });

  it("transitively registers union variant types", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Cat { meow: string; }
        model Dog { bark: string; }
        union Pet { cat: Cat, dog: Dog }
      }
    `);

    const tk = $(tester.program);
    const pet = TestNs.unions.get("Pet")!;

    // Only pass the union, not the variant types directly
    const graph = buildTypeGraph(tester.program, tk, [pet]);

    // Union should be registered
    expect(graph.globalNamespace.unions.has("Pet")).toBe(true);
    // Variant types should be transitively registered
    expect(graph.globalNamespace.models.has("Cat")).toBe(true);
    expect(graph.globalNamespace.models.has("Dog")).toBe(true);
  });

  it("supports chained stages", async () => {
    const { TestNs } = await tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Foo { name: string; }
      }
    `);

    const tk = $(tester.program);
    const originalFoo = TestNs.models.get("Foo")!;

    const fooV1 = tk.type.clone(originalFoo);
    fooV1.name = "FooV1";
    const graph1 = buildTypeGraph(tester.program, tk, [fooV1]);

    const stage2Input = graph1.globalNamespace.models.get("FooV1")!;
    const fooV2 = tk.type.clone(stage2Input);
    fooV2.name = "FooV2";
    const graph2 = buildTypeGraph(tester.program, tk, [fooV2]);

    expect(graph2.globalNamespace.models.has("FooV2")).toBe(true);
    expect(graph2.globalNamespace).not.toBe(graph1.globalNamespace);

    const visited: string[] = [];
    navigateTypesInNamespace(graph2.globalNamespace, {
      model: (m) => visited.push(m.name),
    });
    expect(visited).toContain("FooV2");
  });
});
