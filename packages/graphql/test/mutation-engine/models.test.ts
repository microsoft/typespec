import { isArrayModelType, type Model } from "@typespec/compiler";
import { t, TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createGraphQLMutationEngine,
  GraphQLTypeContext,
} from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Models", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid model names alone", async () => {
    const { ValidModel } = await tester.compile(t.code`model ${t.model("ValidModel")} { }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(ValidModel, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("ValidModel");
  });

  it("renames invalid model names", async () => {
    await tester.compile(t.code`model ${t.model("$Invalid$")} { x: string; }`);

    const InvalidModel = tester.program.getGlobalNamespaceType().models.get("$Invalid$")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(InvalidModel, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("_Invalid");
  });

  it("processes model properties through sanitization", async () => {
    const { TestModel } = await tester.compile(
      t.code`model ${t.model("TestModel")} { validProp: string }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(TestModel, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("TestModel");
    expect(mutation.mutatedType.properties.has("validProp")).toBe(true);
  });
});

describe("GraphQL Mutation Engine - Record-to-Scalar", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("replaces named Record model with a scalar", async () => {
    const { Metadata } = await tester.compile(
      t.code`model ${t.model("Metadata")} is Record<string>;`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Metadata, GraphQLTypeContext.Output);

    expect(mutation.mutationNode.isReplaced).toBe(true);
    const resolved = mutation.mutationNode.replacementNode!.mutatedType;
    expect(resolved).toHaveProperty("kind", "Scalar");
    expect(resolved).toHaveProperty("name", "Metadata");
  });

  it("produces same scalar name for Record in both input and output contexts", async () => {
    const { Metadata } = await tester.compile(
      t.code`model ${t.model("Metadata")} is Record<string>;`,
    );

    const engine = createTestEngine(tester.program);
    const outputMutation = engine.mutateModel(Metadata, GraphQLTypeContext.Output);
    const inputMutation = engine.mutateModel(Metadata, GraphQLTypeContext.Input);

    const outputScalar = outputMutation.mutationNode.replacementNode!.mutatedType;
    const inputScalar = inputMutation.mutationNode.replacementNode!.mutatedType;

    // Both should produce the same scalar name - no Input suffix for Records
    expect(outputScalar).toHaveProperty("name", "Metadata");
    expect(inputScalar).toHaveProperty("name", "Metadata");
  });

  it("replaces Record model with scalar even through T | null unwrap", async () => {
    const { Foo } = await tester.compile(
      t.code`
        model ${t.model("Metadata")} is Record<string>;
        model ${t.model("Foo")} { data: Metadata | null; }
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const dataProp = mutation.mutatedType.properties.get("data")!;
    // After T|null unwrap + Record mutation, should be a Scalar
    expect(dataProp.type).toHaveProperty("kind", "Scalar");
    expect(dataProp.type).toHaveProperty("name", "Metadata");
  });

  it("does not replace Record model that has named properties", async () => {
    const { Config } = await tester.compile(
      t.code`model ${t.model("Config")} { debug: boolean; ...Record<string>; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Config, GraphQLTypeContext.Output);

    expect(mutation.mutationNode.isReplaced).toBe(false);
    expect(mutation.mutatedType.kind).toBe("Model");
    expect(mutation.mutatedType.name).toBe("Config");
  });
});

describe("GraphQL Mutation Engine - Inner Nullable Array Fix", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("unwraps inner nullable union in array element for (T | null)[] | null", async () => {
    const { Foo } = await tester.compile(
      t.code`model ${t.model("Foo")} { tags: (string | null)[] | null; }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Foo, GraphQLTypeContext.Output);

    const tagsProp = mutation.mutatedType.properties.get("tags")!;
    expect(tagsProp.type.kind).toBe("Model");
    // The array's indexer value should be the unwrapped scalar, not a T | null union
    const arrayModel = tagsProp.type as Model;
    expect(isArrayModelType(arrayModel)).toBe(true);
    expect(arrayModel.indexer!.value.kind).toBe("Scalar");
  });
});

describe("GraphQL Mutation Engine - Model Properties", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid property names alone", async () => {
    const { M } = await tester.compile(
      t.code`model ${t.model("M")} { ${t.modelProperty("prop")}: string }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(M, GraphQLTypeContext.Output);
    const prop = mutation.mutatedType.properties.get("prop");

    expect(prop?.name).toBe("prop");
  });

  it("renames invalid property names", async () => {
    const { M } = await tester.compile(t.code`model ${t.model("M")} { \`$prop$\`: string }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(M, GraphQLTypeContext.Output);

    // Check that the property was renamed in the mutated model
    expect(mutation.mutatedType.properties.has("_prop")).toBe(true);
    expect(mutation.mutatedType.properties.has("$prop$")).toBe(false);
  });
});

describe("GraphQL Mutation Engine - Edge Cases", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("handles model with multiple invalid properties", async () => {
    const { M } = await tester.compile(
      t.code`model ${t.model("M")} {
        \`$prop1$\`: string;
        \`prop-2\`: int32;
        \`prop.3\`: boolean;
      }`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(M, GraphQLTypeContext.Output);
    const mutated = mutation.mutatedType;

    expect(mutated.properties.has("_prop1")).toBe(true);
    expect(mutated.properties.has("prop_2")).toBe(true);
    expect(mutated.properties.has("prop_3")).toBe(true);
    expect(mutated.properties.has("$prop1$")).toBe(false);
    expect(mutated.properties.has("prop-2")).toBe(false);
    expect(mutated.properties.has("prop.3")).toBe(false);
  });

  it("handles enum with multiple invalid members", async () => {
    const { E } = await tester.compile(
      t.code`enum ${t.enum("E")} {
        \`$val1$\`,
        \`val-2\`,
        \`val.3\`
      }`,
    );

    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(E).mutatedType;

    expect(mutated.members.has("_VAL_1")).toBe(true);
    expect(mutated.members.has("VAL_2")).toBe(true);
    expect(mutated.members.has("VAL_3")).toBe(true);
  });

  it("preserves valid underscore-prefixed names", async () => {
    const { _ValidName } = await tester.compile(t.code`model ${t.model("_ValidName")} { }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(_ValidName, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("_ValidName");
  });

  it("preserves names with numbers in the middle", async () => {
    const { Model123 } = await tester.compile(t.code`model ${t.model("Model123")} { }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(Model123, GraphQLTypeContext.Output);

    expect(mutation.mutatedType.name).toBe("Model123");
  });

  it("handles property names starting with numbers", async () => {
    const { M } = await tester.compile(t.code`model ${t.model("M")} { \`123prop\`: string; }`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateModel(M, GraphQLTypeContext.Output);
    const mutated = mutation.mutatedType;

    expect(mutated.properties.has("_123prop")).toBe(true);
    expect(mutated.properties.has("123prop")).toBe(false);
  });

  it("handles enum member names starting with numbers", async () => {
    const { E } = await tester.compile(t.code`enum ${t.enum("E")} { \`123value\` }`);

    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(E).mutatedType;

    expect(mutated.members.has("_123_VALUE")).toBe(true);
    expect(mutated.members.has("123value")).toBe(false);
  });
});
