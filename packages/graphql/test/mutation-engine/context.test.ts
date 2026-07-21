import type { Model } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isOneOf } from "../../generated-defs/TypeSpec.GraphQL.js";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Input/Output Context", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("produces separate mutations for input and output contexts", async () => {
    const { Book } = await tester.compile(t.code`model ${t.model("Book")} { title: string; }`);

    const engine = createTestEngine(tester.program);
    const inputMutation = engine.mutateModel(Book, GraphQLTypeContext.Input);
    const outputMutation = engine.mutateModel(Book, GraphQLTypeContext.Output);

    // Different mutation objects (different cache entries)
    expect(inputMutation).not.toBe(outputMutation);
    // Both produce valid mutated types
    expect(inputMutation.mutatedType.name).toBe("BookInput");
    expect(outputMutation.mutatedType.name).toBe("Book");
  });

  it("returns cached mutation for same type and context", async () => {
    const { Book } = await tester.compile(t.code`model ${t.model("Book")} { title: string; }`);

    const engine = createTestEngine(tester.program);
    const first = engine.mutateModel(Book, GraphQLTypeContext.Input);
    const second = engine.mutateModel(Book, GraphQLTypeContext.Input);

    expect(first).toBe(second);
  });

  it("exposes typeContext on the mutation", async () => {
    const { Book } = await tester.compile(t.code`model ${t.model("Book")} { title: string; }`);

    const engine = createTestEngine(tester.program);
    const inputMutation = engine.mutateModel(Book, GraphQLTypeContext.Input);
    const outputMutation = engine.mutateModel(Book, GraphQLTypeContext.Output);

    expect(inputMutation.typeContext).toBe(GraphQLTypeContext.Input);
    expect(outputMutation.typeContext).toBe(GraphQLTypeContext.Output);
  });
});

describe("GraphQL Mutation Engine - Operation Context Propagation", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("mutates operation parameters with input context", async () => {
    const { Book, createBook } = await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("createBook")}(input: Book): void;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(createBook);

    // The model should now be cached under the input key
    const inputMutation = engine.mutateModel(Book, GraphQLTypeContext.Input);
    expect(inputMutation.typeContext).toBe(GraphQLTypeContext.Input);
  });

  it("mutates operation return type with output context", async () => {
    const { Book, getBook } = await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("getBook")}(): Book;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(getBook);

    // The model should now be cached under the output key
    const outputMutation = engine.mutateModel(Book, GraphQLTypeContext.Output);
    expect(outputMutation.typeContext).toBe(GraphQLTypeContext.Output);
  });

  it("creates separate variants when model is used as both param and return", async () => {
    const { Book, createBook } = await tester.compile(
      t.code`
        model ${t.model("Book")} { title: string; }
        op ${t.op("createBook")}(input: Book): Book;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(createBook);

    const inputMutation = engine.mutateModel(Book, GraphQLTypeContext.Input);
    const outputMutation = engine.mutateModel(Book, GraphQLTypeContext.Output);

    expect(inputMutation).not.toBe(outputMutation);
    expect(inputMutation.typeContext).toBe(GraphQLTypeContext.Input);
    expect(outputMutation.typeContext).toBe(GraphQLTypeContext.Output);
  });

  it("propagates input context to nested models", async () => {
    const { Author, createBook } = await tester.compile(
      t.code`
        model ${t.model("Author")} { name: string; }
        model ${t.model("Book")} { title: string; author: Author; }
        op ${t.op("createBook")}(input: Book): void;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(createBook);

    // Author should also be cached under input context via Book's property
    const authorInput = engine.mutateModel(Author, GraphQLTypeContext.Input);
    expect(authorInput.typeContext).toBe(GraphQLTypeContext.Input);
  });

  it("propagates output context to nested models", async () => {
    const { Author, getBook } = await tester.compile(
      t.code`
        model ${t.model("Author")} { name: string; }
        model ${t.model("Book")} { title: string; author: Author; }
        op ${t.op("getBook")}(): Book;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(getBook);

    const authorOutput = engine.mutateModel(Author, GraphQLTypeContext.Output);
    expect(authorOutput.typeContext).toBe(GraphQLTypeContext.Output);
  });

  it("replaces union parameter with oneOf model via operation mutation", async () => {
    const { Pet, createPet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
        op ${t.op("createPet")}(input: Pet): void;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(createPet);

    // The union should be cached under input context and replaced with a oneOf model
    const unionMutation = engine.mutateUnion(Pet, GraphQLTypeContext.Input);
    expect(unionMutation.mutatedType.kind).toBe("Model");
    expect(unionMutation.mutatedType.name).toBe("PetInput");
    expect(isOneOf(tester.program, unionMutation.mutatedType as Model)).toBe(true);
  });

  it("keeps union return type as union via operation mutation", async () => {
    const { Pet, getPet } = await tester.compile(
      t.code`
        model ${t.model("Cat")} { name: string; }
        model ${t.model("Dog")} { breed: string; }
        union ${t.union("Pet")} { cat: Cat; dog: Dog; }
        op ${t.op("getPet")}(): Pet;
      `,
    );

    const engine = createTestEngine(tester.program);
    engine.mutateOperation(getPet);

    // The union in output context stays a union (not replaced)
    const unionMutation = engine.mutateUnion(Pet, GraphQLTypeContext.Output);
    expect(unionMutation.mutatedType.kind).toBe("Union");
  });
});
