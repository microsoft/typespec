import { getDoc, type Model, type Union } from "@typespec/compiler";
import { t, TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isNullable } from "../../src/lib/nullable.js";
import { isOneOf } from "../../src/lib/one-of.js";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { printMutatedType } from "../../src/mutation-engine/print-type.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Unions", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("replaces nullable scalar union with inner type", async () => {
    const { NullableString } = await tester.compile(
      t.code`union ${t.union("NullableString")} { string, null }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(NullableString, GraphQLTypeContext.Output);

    // T | null is replaced with the inner type (string scalar)
    expect(mutation.mutatedType.kind).toBe("Scalar");
    expect(mutation.wrapperModels).toHaveLength(0);
    // The replacement type is NOT marked nullable — nullability for inline T | null
    // is tracked on the model property, not the shared scalar singleton.
    expect(isNullable(mutation.mutatedType)).toBe(false);
  });

  it("replaces nullable model union with inner type", async () => {
    const { MaybeDog } = await tester.compile(
      t.code`
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("MaybeDog")} { Dog, null }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(MaybeDog, GraphQLTypeContext.Output);

    // Dog | null is replaced with the inner type (Dog model)
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.wrapperModels).toHaveLength(0);
    // The replacement type is NOT marked nullable — nullability for inline T | null
    // is tracked on the model property, not the shared type.
    expect(isNullable(mutation.mutatedType)).toBe(false);
  });

  it("creates wrapper models for scalar variants", async () => {
    const { Mixed } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Mixed")} { cat: Cat; text: string; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Mixed, GraphQLTypeContext.Output);

    // Only the scalar variant (string) should get a wrapper
    expect(mutation.wrapperModels).toHaveLength(1);
    expect(mutation.wrapperModels[0].name).toBe("MixedTextUnionVariant");
  });

  it("substitutes wrapper models into union variant types", async () => {
    const { Mixed } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Mixed")} { cat: Cat; text: string; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Mixed, GraphQLTypeContext.Output);
    const mutatedUnion = mutation.mutatedType as Union;

    const variants = [...mutatedUnion.variants.values()];
    expect(variants).toHaveLength(2);

    // Model variant points to the mutated model
    const catVariant = variants.find((v) => v.name === "cat")!;
    expect(catVariant.type.kind).toBe("Model");
    expect((catVariant.type as Model).name).toBe("Cat");

    // Scalar variant points to the wrapper model, not the raw scalar
    const textVariant = variants.find((v) => v.name === "text")!;
    expect(textVariant.type.kind).toBe("Model");
    expect((textVariant.type as Model).name).toBe("MixedTextUnionVariant");
  });

  it("does not create wrappers for model-only unions", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);

    expect(mutation.wrapperModels).toHaveLength(0);
  });

  it("collapses single-scalar-variant union to the scalar type", async () => {
    const { Data } = await tester.compile(t.code`union ${t.union("Data")} { text: string; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Data, GraphQLTypeContext.Output);

    // Single variant → collapsed to the scalar directly (no union or wrapper)
    expect(mutation.mutatedType.kind).toBe("Scalar");
    expect(mutation.wrapperModels).toHaveLength(0);
  });

  it("creates wrappers for multiple scalar variants", async () => {
    const { Mixed } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Mixed")} { cat: Cat; text: string; count: int32; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Mixed, GraphQLTypeContext.Output);

    expect(mutation.wrapperModels).toHaveLength(2);
    const names = mutation.wrapperModels.map((m) => m.name).sort();
    expect(names).toEqual(["MixedCountUnionVariant", "MixedTextUnionVariant"]);

    // All union variants point to Models (originals or wrappers)
    const mutatedUnion = mutation.mutatedType as Union;
    const variants = [...mutatedUnion.variants.values()];
    for (const variant of variants) {
      expect(variant.type.kind).toBe("Model");
    }
  });

  it("names anonymous return type union as OperationUnion", async () => {
    await tester.compile(`
      model Foo { x: int32; }
      model Bar { y: string; }
      op getBaz(): Foo | Bar;
    `);

    const getBaz = tester.program.getGlobalNamespaceType().operations.get("getBaz")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(getBaz.returnType as Union, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.kind).toBe("Union");
    expect((mutation.mutatedType as Union).name).toBe("GetBazUnion");
  });

  it("names anonymous union on model property as ModelPropertyUnion", async () => {
    const { Foo } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        model ${t.model("Foo")} { pet: Cat | Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const petProp = mutation.mutatedType.properties.get("pet")!;
    expect(petProp.type.kind).toBe("Union");
    expect((petProp.type as Union).name).toBe("FooPetUnion");
  });

  it("collapses union to single type after flattening deduplicates to one variant", async () => {
    const { Outer } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Inner")} { a: Cat; }
        union ${t.union("Outer")} { inner: Inner; cat: Cat; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Outer, GraphQLTypeContext.Output);

    // Inner flattens to Cat, Outer's cat is also Cat → dedup → 1 variant → collapse
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("Cat");
  });

  it("flattened union variant types get their mutation pipeline applied", async () => {
    await tester.compile(`
      model ad_account { id: int32; }
      model board { title: string; }
      union Mixed { a: ad_account; b: board; null; }
    `);

    const Mixed = tester.program.getGlobalNamespaceType().unions.get("Mixed")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Mixed, GraphQLTypeContext.Output);

    // After null-strip + flattening, variants should have mutated names
    const mutatedUnion = mutation.mutatedType as Union;
    const variantNames = [...mutatedUnion.variants.values()]
      .map((v) => ("name" in v.type ? v.type.name : v.type.kind))
      .sort();
    expect(variantNames).toEqual(["AdAccount", "Board"]);
  });

  it("preserves decorator state (e.g. @doc) on flattened unions", async () => {
    const { MaybePet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        /** A pet or nothing */
        union ${t.union("MaybePet")} { cat: Cat; dog: Dog; null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(MaybePet, GraphQLTypeContext.Output);

    expect(getDoc(tester.program, mutation.mutatedType)).toBe("A pet or nothing");
  });

  it("T | null replacement gets its mutation pipeline applied", async () => {
    await tester.compile(`
      model ad_account { id: int32; }
      union MaybeAccount { ad_account, null }
    `);

    const MaybeAccount = tester.program.getGlobalNamespaceType().unions.get("MaybeAccount")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(MaybeAccount, GraphQLTypeContext.Output);

    // T | null unwraps to ad_account → mutation renames to AdAccount
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("AdAccount");
  });

  it("collapsed type gets its mutation pipeline applied (e.g. naming)", async () => {
    await tester.compile(`
      model ad_account { id: int32; }
      union Inner { a: ad_account; }
      union Outer { inner: Inner; dup: ad_account; }
    `);

    const Outer = tester.program.getGlobalNamespaceType().unions.get("Outer")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Outer, GraphQLTypeContext.Output);

    // Flattens to one unique type (ad_account) → collapses → mutation renames to AdAccount
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("AdAccount");
  });

  it("collapses nullable multi-variant union when only one variant remains after null strip", async () => {
    const { Things } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Things")} { cat: Cat; dup: Cat; null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Things, GraphQLTypeContext.Output);

    // Strip null → Cat, Cat → dedup → 1 variant → collapse
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("Cat");
    expect(isNullable(mutation.mutatedType)).toBe(true);
  });

  it("handles circular type references without infinite recursion", async () => {
    const { Tree } = await tester.compile(
      t.code`
        model ${t.model("Leaf")} { value: int32; }
        model ${t.model("Tree")} { children: Tree | Leaf | null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    // Should complete without stack overflow
    const mutation = engine.mutateModel(Tree, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("Tree");
  });

  it("sanitizes union name in mutated type", async () => {
    const { ValidUnion } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("ValidUnion")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(ValidUnion, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("ValidUnion");
  });

  it("string | null property → String (nullable)", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { name: string | null; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const nameProp = mutation.mutatedType.properties.get("name")!;
    expect(nameProp.type.kind).toBe("Scalar");
    expect(printMutatedType(nameProp)).toBe("String");
  });

  it("string[] property → [String!]!", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { tags: string[]; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tagsProp)).toBe("[String!]!");
  });

  it("(string | null)[] property → [String]!", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[]; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tagsProp)).toBe("[String]!");
  });

  it("string[] | null property → [String!]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: string[] | null; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tagsProp)).toBe("[String!]");
  });

  it("(string | null)[] | null property → [String]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[] | null; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tagsProp)).toBe("[String]");
  });
});

describe("GraphQL Mutation Engine - oneOf Input Objects", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("replaces union with oneOf model in input context", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);

    // Union is replaced with a Model in the type graph
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("PetInput");
    expect(isOneOf(mutation.mutatedType as Model)).toBe(true);
  });

  it("PascalCases oneOf model name for snake_case unions", async () => {
    await tester.compile(`
      model Cat { name: string; }
      model Dog { breed: string; }
      union pet_type { cat: Cat; dog: Dog; }
    `);

    const petType = tester.program.getGlobalNamespaceType().unions.get("pet_type")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(petType, GraphQLTypeContext.Input);

    expect(mutation.mutatedType.name).toBe("PetTypeInput");
  });

  it("camelCases oneOf field names for snake_case variants", async () => {
    await tester.compile(`
      model Cat { name: string; }
      model Dog { breed: string; }
      union Pet { my_cat: Cat; my_dog: Dog; }
    `);

    const Pet = tester.program.getGlobalNamespaceType().unions.get("Pet")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);
    const model = mutation.mutatedType as Model;

    const fieldNames = Array.from(model.properties.values()).map((p) => p.name);
    expect(fieldNames).toContain("myCat");
    expect(fieldNames).toContain("myDog");
  });

  it("oneOf model has one field per variant, all optional", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);
    const model = mutation.mutatedType as Model;

    expect(model.properties.size).toBe(2);
    expect(model.properties.has("cat")).toBe(true);
    expect(model.properties.has("dog")).toBe(true);
    // All fields are optional (oneOf semantics)
    expect(model.properties.get("cat")!.optional).toBe(true);
    expect(model.properties.get("dog")!.optional).toBe(true);
  });

  it("keeps union in output context (no replacement)", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.kind).toBe("Union");
  });

  it("oneOf model handles scalar variants", async () => {
    const { Data } = await tester.compile(
      t.code`
        model ${t.model("Foo")} { x: int32; }
        union ${t.union("Data")} { text: string; num: int32; foo: Foo; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Data, GraphQLTypeContext.Input);
    const model = mutation.mutatedType as Model;

    // All variants become fields — no wrapper models needed for oneOf
    expect(model.properties.size).toBe(3);
    expect(model.properties.has("text")).toBe(true);
    expect(model.properties.has("num")).toBe(true);
    expect(model.properties.has("foo")).toBe(true);
    // No wrapper models created in input context
    expect(mutation.wrapperModels).toHaveLength(0);
  });

  it("oneOf model flattens and deduplicates nested unions", async () => {
    const { Outer } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        model ${t.model("Bird")} { wingspan: int32; }
        union ${t.union("Inner")} { cat: Cat; dog: Dog; }
        union ${t.union("Outer")} { inner: Inner; bird: Bird; dog2: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Outer, GraphQLTypeContext.Input);
    const model = mutation.mutatedType as Model;

    // Inner is flattened: Cat + Dog from Inner, Bird from Outer
    // Dog appears twice (from Inner and as dog2) — deduplicated to one
    expect(model.properties.size).toBe(3);
    expect(model.properties.has("cat")).toBe(true);
    expect(model.properties.has("dog")).toBe(true);
    expect(model.properties.has("bird")).toBe(true);
  });

  it("strips null from multi-variant union in output context", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);

    // Null should be stripped — only Cat and Dog remain
    const mutatedUnion = mutation.mutatedType as Union;
    expect(mutatedUnion.kind).toBe("Union");
    expect(mutatedUnion.variants.size).toBe(2);

    // The result should be marked as nullable
    expect(isNullable(mutatedUnion)).toBe(true);
  });

  it("strips null from multi-variant union in input context", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);

    // Should become a @oneOf model with 2 fields (null stripped)
    const model = mutation.mutatedType as Model;
    expect(model.kind).toBe("Model");
    expect(model.properties.size).toBe(2);
    expect(model.properties.has("cat")).toBe(true);
    expect(model.properties.has("dog")).toBe(true);

    // Should be marked as both @oneOf and nullable
    expect(isOneOf(model)).toBe(true);
    expect(isNullable(model)).toBe(true);
  });

  it("non-nullable union is not marked as nullable", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);

    expect(isNullable(mutation.mutatedType)).toBe(false);
  });

  it("exposes typeContext on union mutation", async () => {
    const { Pet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        union ${t.union("Pet")} { cat: Cat; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const inputMutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);
    const outputMutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);

    expect(inputMutation.typeContext).toBe(GraphQLTypeContext.Input);
    expect(outputMutation.typeContext).toBe(GraphQLTypeContext.Output);
  });
});
