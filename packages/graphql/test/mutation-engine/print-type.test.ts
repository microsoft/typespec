import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { printMutatedType } from "../../src/mutation-engine/print-type.js";
import { Tester } from "../test-host.js";

describe("printMutatedType", () => {
  let tester: TesterInstance;

  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("required string → String!", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { name: string; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("name")!;
    expect(printMutatedType(prop)).toBe("String!");
  });

  it("optional string → String", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { name?: string; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("name")!;
    expect(printMutatedType(prop)).toBe("String");
  });

  it("string | null → String", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { name: string | null; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("name")!;
    expect(printMutatedType(prop)).toBe("String");
  });

  it("required string[] → [String!]!", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { tags: string[]; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("tags")!;
    expect(printMutatedType(prop)).toBe("[String!]!");
  });

  it("optional string[] → [String!]", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { tags?: string[]; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("tags")!;
    expect(printMutatedType(prop)).toBe("[String!]");
  });

  it("(string | null)[] → [String]!", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[]; }`,
    );
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("tags")!;
    expect(printMutatedType(prop)).toBe("[String]!");
  });

  it("string[] | null → [String!]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: string[] | null; }`,
    );
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("tags")!;
    expect(printMutatedType(prop)).toBe("[String!]");
  });

  it("(string | null)[] | null → [String]", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[] | null; }`,
    );
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("tags")!;
    expect(printMutatedType(prop)).toBe("[String]");
  });

  it("required model type → ModelName!", async () => {
    const { Foo } = await tester.compile(
      t.code`
        model ${t.model("Bar")} { id: string; }
        model ${t.model("Foo")} { bar: Bar; }
      `,
    );
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("bar")!;
    expect(printMutatedType(prop)).toBe("Bar!");
  });

  it("required int32 → Int!", async () => {
    const { Foo } = await tester.compile(t.code`model ${t.model("Foo")} { count: int32; }`);
    const engine = createGraphQLMutationEngine(tester.program);
    const mutated = engine.mutateModel(Foo, GraphQLTypeContext.Output);
    const prop = mutated.mutatedType.properties.get("count")!;
    expect(printMutatedType(prop)).toBe("Int!");
  });
});
