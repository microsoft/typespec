import { t, TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isInputType } from "../../src/lib/input-type.js";
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
    await tester.compile(
      t.code`
        model ${t.model("ad_account")} { id: int32; }
        op ${t.op("getAccount")}(): ad_account;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, true);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
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
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    // Scalar variants get wrapper models registered in the TypeGraph
    expect(typeGraph.globalNamespace.models.has("MixedTextUnionVariant")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("MixedNumUnionVariant")).toBe(true);
  });

  it("produces Input variant for models used as operation parameters", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("getBooks")}(): Book[];
        op ${t.op("createBook")}(input: Book): Book;
      `,
    );

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
    await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("getBooks")}(): Book[];
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    expect(typeGraph.globalNamespace.models.has("Book")).toBe(true);
    expect(typeGraph.globalNamespace.models.has("BookInput")).toBe(false);
  });

  it("does not produce Output variant for input-only models", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        model ${t.model("Payload")} { title: string; }
        op ${t.op("getBooks")}(): Book[];
        op ${t.op("createBook")}(input: Payload): Book;
      `,
    );

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
    await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("getBooks")}(): Book[];
        op ${t.op("createBook")}(input: Book): Book;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const typeUsage = resolveTypeUsage(tester.program, ns, false);
    const engine = createGraphQLMutationEngine(tester.program);
    const typeGraph = mutateSchema(tester.program, engine, ns, typeUsage);

    const bookOutput = typeGraph.globalNamespace.models.get("Book")!;
    const bookInput = typeGraph.globalNamespace.models.get("BookInput")!;

    expect(isInputType(bookOutput)).toBe(false);
    expect(isInputType(bookInput)).toBe(true);
  });

  it("mutateDecoratorTypeArgs does not corrupt source type decorator args", async () => {
    await tester.compile(
      t.code`
        @graphqlInterface model ${t.model("Animal")} { name: string; }
        @compose(Animal)
        model ${t.model("Cat")} { name: string; breed: string; }
        op ${t.op("getCat")}(): Cat;
        op ${t.op("createCat")}(input: Cat): Cat;
      `,
    );

    const ns = tester.program.getGlobalNamespaceType();
    const sourceCat = ns.models.get("Cat")!;
    const sourceComposeArg = sourceCat.decorators.find(
      (d) => d.decorator.name === "$compose",
    )?.args[0];

    const typeUsage = resolveTypeUsage(tester.program, ns, true);
    const engine = createGraphQLMutationEngine(tester.program);
    mutateSchema(tester.program, engine, ns, typeUsage);

    // Source type's decorator args must not be modified by mutation
    expect((sourceComposeArg!.value as any).name).toBe("Animal");
  });

  it("interfaceOnly @interface model used as output does not produce name collision", async () => {
    await tester.compile(
      t.code`
        @graphqlInterface(#{interfaceOnly: true}) model ${t.model("Node")} { id: string; }
        op ${t.op("getNode")}(): Node;
      `,
    );

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
    const [_, diagnostics] = await tester.compileAndDiagnose(
      t.code`
        model ${t.model("BookInput")} { x: int32; }
        model ${t.model("Book")} { title: string; }
        op ${t.op("getBooks")}(): Book[];
        op ${t.op("createBook")}(input: Book): Book;
      `,
    );

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
    await tester.compile(
      t.code`
        model ${t.model("Item")} { name: string; }
        op ${t.op("getItems")}(): Item[];
      `,
    );

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
