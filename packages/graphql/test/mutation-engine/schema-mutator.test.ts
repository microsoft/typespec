import type { Model } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isInputType } from "../../generated-defs/TypeSpec.GraphQL.js";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { mutateSchema } from "../../src/mutation-engine/schema-mutator.js";
import { resolveTypeUsage } from "../../src/type-usage.js";
import { Tester } from "../test-host.js";

describe("mutateSchema", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("produces a TypeGraph with mutated models", async () => {
    await tester.compile(`
      model ad_account { id: int32; }
      op getAccount(): ad_account;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("AdAccount")).toBe(true);
  });

  it("produces a TypeGraph with mutated operations", async () => {
    await tester.compile(`
      op get_items(): string;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.operations.has("getItems")).toBe(true);
  });

  it("produces a TypeGraph with mutated enums", async () => {
    await tester.compile(`
      enum status { active, inactive }
      model Foo { s: status; }
      op getFoo(): Foo;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.enums.has("Status")).toBe(true);
  });

  it("produces a TypeGraph with mutated unions", async () => {
    await tester.compile(`
      model Cat { name: string; }
      model Dog { breed: string; }
      union Pet { cat: Cat; dog: Dog; }
      op getPet(): Pet;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.unions.has("Pet")).toBe(true);
  });

  it("skips unreachable types when omitUnreachableTypes is true", async () => {
    await tester.compile(`
      model Reachable { x: int32; }
      model Unreachable { y: string; }
      op getReachable(): Reachable;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Reachable")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("Unreachable")).toBe(false);
  });

  it("includes all declared types when omitUnreachableTypes is false", async () => {
    await tester.compile(`
      model Reachable { x: int32; }
      model Unreachable { y: string; }
      op getReachable(): Reachable;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Reachable")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("Unreachable")).toBe(true);
  });

  it("T | null unions do not appear in the TypeGraph (engine replaces with inner type)", async () => {
    await tester.compile(`
      union MaybeString { string, null }
      model Foo { x: int32; }
      op getFoo(): Foo;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // MaybeString is T | null — should NOT appear as a union in the TypeGraph
    expect(typeGraph.globalNamespace.unions.has("MaybeString")).toBe(false);
  });

  it("includes wrapper models from union scalar variants", async () => {
    await tester.compile(`
      model Cat { name: string; }
      union Mixed { cat: Cat; text: string; num: int32; }
      op getMixed(): Mixed;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Scalar variants get wrapper models registered in the TypeGraph
    expect(typeGraph.globalNamespace.models.has("MixedTextUnionVariant")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("MixedNumUnionVariant")).toBe(true);
  });

  it("produces Input variant for models used as operation parameters", async () => {
    await tester.compile(`
      model Book { title: string; }
      op getBooks(): Book[];
      op createBook(input: Book): Book;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Book is used as both output (return) and input (parameter),
    // so both variants should appear in the TypeGraph
    expect(typeGraph.globalNamespace.models.has("Book")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("BookInput")).toBe(true);
  });

  it("does not produce Input variant for output-only models", async () => {
    await tester.compile(`
      model Book { title: string; }
      op getBooks(): Book[];
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Book")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("BookInput")).toBe(false);
  });

  it("does not produce Output variant for input-only models", async () => {
    await tester.compile(`
      model Book { title: string; }
      model Payload { title: string; }
      op getBooks(): Book[];
      op createBook(input: Payload): Book;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Payload is only used as input — should only appear as Input variant (PayloadInput)
    expect(typeGraph.globalNamespace.models.has("PayloadInput")).toBe(true);
    // Should NOT have an Output variant
    expect(typeGraph.globalNamespace.models.has("Payload")).toBe(false);
  });

  it("marks input models with isInputType decorator", async () => {
    await tester.compile(`
      model Book { title: string; }
      op getBooks(): Book[];
      op createBook(input: Book): Book;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    const bookOutput = typeGraph.globalNamespace.models.get("Book")!;
    const bookInput = typeGraph.globalNamespace.models.get("BookInput")!;

    expect(isInputType(tester.program, bookOutput)).toBe(false);
    expect(isInputType(tester.program, bookInput)).toBe(true);
  });

  it("mutateDecoratorTypeArgs does not corrupt source type decorator args", async () => {
    const { Cat } = await tester.compile(
      t.code`
        @graphqlInterface model Animal { name: string; }
        @compose(Animal)
        model ${t.model("Cat")} { name: string; breed: string; }
        op getCat(): Cat;
        op createCat(input: Cat): Cat;
      `,
    );

    const sourceComposeArg = (Cat as Model).decorators.find((d) => d.decorator.name === "$compose")
      ?.args[0];

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    mutateSchema(tester.program, engine, ns, typeUsage);

    // Source type's decorator args must not be modified by mutation
    expect((sourceComposeArg!.value as any).name).toBe("Animal");
  });

  it("interfaceOnly @graphqlInterface model used as output does not produce name collision", async () => {
    await tester.compile(`
      @graphqlInterface(#{interfaceOnly: true}) model Node { id: string; }
      op getNode(): Node;
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Exclusive interface: only Interface variant emitted (no suffix → "Node")
    // Should NOT also emit an Output variant (which would also be "Node" → collision)
    expect(typeGraph.globalNamespace.models.has("Node")).toBe(true);
    const collisions = tester.program.diagnostics.filter(
      (d) => d.code === "@typespec/graphql/type-name-collision",
    );
    expect(collisions.length).toBe(0);
  });

  it("reports diagnostic when two types produce the same GraphQL name", async () => {
    await tester.compileAndDiagnose(`
      model BookInput { x: int32; }
      model Book { title: string; }
      op getBooks(): Book[];
      op createBook(input: Book): Book;
    `);

    // Book used as input → Input mutation → "BookInput"
    // BookInput declared explicitly → Output mutation → "BookInput"
    // This should produce a collision diagnostic
    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    mutateSchema(tester.program, engine, ns, typeUsage);

    const collisions = tester.program.diagnostics.filter(
      (d) => d.code === "@typespec/graphql/type-name-collision",
    );
    expect(collisions.length).toBeGreaterThan(0);
  });

  it("skips array models (they are list types, not object types)", async () => {
    await tester.compile(`
      model Item { name: string; }
      op getItems(): Item[];
    `);

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Item should be in the graph, but the Array<Item> model should NOT
    expect(typeGraph.globalNamespace.models.has("Item")).toBe(true);
    const modelNames = [...typeGraph.globalNamespace.models.keys()];
    expect(modelNames.every((n) => !n.includes("Array"))).toBe(true);
  });
});
