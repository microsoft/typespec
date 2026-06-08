import type { Model, Union } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
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
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
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
    expect(isNullable(tester.program, mutation.mutatedType)).toBe(false);
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
    expect(isNullable(tester.program, mutation.mutatedType)).toBe(false);
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

  it("wrapper model has value property with the scalar type", async () => {
    const { Data } = await tester.compile(t.code`union ${t.union("Data")} { text: string; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(Data, GraphQLTypeContext.Output);

    expect(mutation.wrapperModels).toHaveLength(1);
    const wrapper = mutation.wrapperModels[0];
    const valueProp = wrapper.properties.get("value");
    expect(valueProp).toBeDefined();
    expect(valueProp!.optional).toBe(false);
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
    expect(printMutatedType(tester.program, nameProp)).toBe("String");
  });

  it("string[] property → [String!]!", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { tags: string[]; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tester.program, tagsProp)).toBe("[String!]!");
  });

  it("(string | null)[] property → [String]!", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[]; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tester.program, tagsProp)).toBe("[String]!");
  });

  it("string[] | null property → [String!]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: string[] | null; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tester.program, tagsProp)).toBe("[String!]");
  });

  it("(string | null)[] | null property → [String]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[] | null; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(printMutatedType(tester.program, tagsProp)).toBe("[String]");
  });
});

describe("GraphQL Mutation Engine - oneOf Input Objects", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
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
    expect(isOneOf(tester.program, mutation.mutatedType as Model)).toBe(true);
  });

  it("PascalCases oneOf model name for snake_case unions", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("pet_type")} { cat: Cat; dog: Dog; }
      `,
    );

    const petType = tester.program.getGlobalNamespaceType().unions.get("pet_type")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateUnion(petType, GraphQLTypeContext.Input);

    expect(mutation.mutatedType.name).toBe("PetTypeInput");
  });

  it("camelCases oneOf field names for snake_case variants", async () => {
    await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { my_cat: Cat; my_dog: Dog; }
      `,
    );

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
    expect(isNullable(tester.program, mutatedUnion)).toBe(true);
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
    expect(isOneOf(tester.program, model)).toBe(true);
    expect(isNullable(tester.program, model)).toBe(true);
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

    expect(isNullable(tester.program, mutation.mutatedType)).toBe(false);
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
