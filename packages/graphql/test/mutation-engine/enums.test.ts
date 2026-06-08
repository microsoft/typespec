import type { EnumMember } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Enums", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid enum names alone", async () => {
    const { ValidEnum } = await tester.compile(
      t.code`enum ${t.enum("ValidEnum")} {
        Value
      }`,
    );

    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(ValidEnum).mutatedType;

    expect(mutated.name).toBe("ValidEnum");
  });

  it("renames invalid enum names", async () => {
    await tester.compile(
      t.code`enum ${t.enum("$Invalid$")} {
        Value
      }`,
    );

    const InvalidEnum = tester.program.getGlobalNamespaceType().enums.get("$Invalid$")!;
    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(InvalidEnum).mutatedType;

    expect(mutated.name).toBe("_Invalid");
  });

  it("processes enum members through sanitization", async () => {
    const { MyEnum } = await tester.compile(
      t.code`enum ${t.enum("MyEnum")} {
        ValidMember
      }`,
    );

    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(MyEnum).mutatedType;

    expect(mutated.name).toBe("MyEnum");
    expect(mutated.members.has("VALID_MEMBER")).toBe(true);
  });
});

describe("GraphQL Mutation Engine - Enum Members", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid enum member names alone", async () => {
    const { MyEnum } = await tester.compile(
      t.code`enum ${t.enum("MyEnum")} {
        ${t.enumMember("ValidMember")}
      }`,
    );

    // Mutate the enum and check the member via the enum's mutation
    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(MyEnum).mutatedType;
    const member = mutated.members.get("VALID_MEMBER");

    expect(member?.name).toBe("VALID_MEMBER");
  });

  it("renames invalid enum member names", async () => {
    const { MyEnum } = await tester.compile(
      t.code`enum ${t.enum("MyEnum")} {
        \`$Value$\`
      }`,
    );

    const engine = createTestEngine(tester.program);
    const mutated = engine.mutateEnum(MyEnum).mutatedType;

    // Check that the member was renamed in the mutated enum
    const member = Array.from(mutated.members.values())[0] as EnumMember;
    expect(member.name).toBe("_VALUE");
  });
});
