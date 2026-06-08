import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { mutateSchema } from "../../src/mutation-engine/schema-mutator.js";
import { resolveTypeUsage } from "../../src/type-usage.js";
import { Tester } from "../test-host.js";

describe("mutateSchema", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("produces a TypeGraph with mutated models", async () => {
    await tester.compile(
      t.code`
        model ${t.model("ad_account")} { id: int32; }
        op ${t.op("getAccount")}(): ad_account;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("AdAccount")).toBe(true);
  });

  it("produces a TypeGraph with mutated operations", async () => {
    await tester.compile(
      t.code`
        op ${t.op("get_items")}(): string;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.operations.has("getItems")).toBe(true);
  });

  it("produces a TypeGraph with mutated enums", async () => {
    await tester.compile(
      t.code`
        enum ${t.enum("status")} { active, inactive }
        model ${t.model("Foo")} { s: status; }
        op ${t.op("getFoo")}(): Foo;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.enums.has("Status")).toBe(true);
  });

  it("produces a TypeGraph with mutated unions", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
        op ${t.op("getPet")}(): Pet;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.unions.has("Pet")).toBe(true);
  });

  it("skips unreachable types when omitUnreachableTypes is true", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Reachable")} { x: int32; }
        model ${t.model("Unreachable")} { y: string; }
        op ${t.op("getReachable")}(): Reachable;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Reachable")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("Unreachable")).toBe(false);
  });

  it("includes all declared types when omitUnreachableTypes is false", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Reachable")} { x: int32; }
        model ${t.model("Unreachable")} { y: string; }
        op ${t.op("getReachable")}(): Reachable;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Reachable")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("Unreachable")).toBe(true);
  });

  it("T | null unions do not appear in the TypeGraph (engine replaces with inner type)", async () => {
    await tester.compile(
      t.code`
        union ${t.union("MaybeString")} { string, null }
        model ${t.model("Foo")} { x: int32; }
        op ${t.op("getFoo")}(): Foo;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // MaybeString is T | null — should NOT appear as a union in the TypeGraph
    expect(typeGraph.globalNamespace.unions.has("MaybeString")).toBe(false);
  });

  it("includes wrapper models from union scalar variants", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Mixed")} { cat: Cat; text: string; num: int32; }
        op ${t.op("getMixed")}(): Mixed;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Scalar variants get wrapper models registered in the TypeGraph
    expect(typeGraph.globalNamespace.models.has("MixedTextUnionVariant")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("MixedNumUnionVariant")).toBe(true);
  });

  it("skips array models (they are list types, not object types)", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Item")} { name: string; }
        op ${t.op("getItems")}(): Item[];
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Item should be in the graph, but the Array<Item> model should NOT
    expect(typeGraph.globalNamespace.models.has("Item")).toBe(true);
    const modelNames = [...typeGraph.globalNamespace.models.keys()];
    expect(modelNames.every((n) => !n.includes("Array"))).toBe(true);
  });
});
