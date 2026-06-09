import { t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { isNullable } from "../../src/lib/nullable.js";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Operations", () => {
  let tester: Awaited<ReturnType<typeof Tester.createInstance>>;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid operation names alone", async () => {
    const { ValidOp } = await tester.compile(t.code`op ${t.op("ValidOp")}(): void;`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateOperation(ValidOp);

    expect(mutation.mutatedType.name).toBe("validOp");
  });

  it("renames invalid operation names", async () => {
    await tester.compile(t.code`op ${t.op("$Do$")}(): void;`);

    const DoOp = tester.program.getGlobalNamespaceType().operations.get("$Do$")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateOperation(DoOp);

    expect(mutation.mutatedType.name).toBe("_do");
  });

  it("renames operation names with hyphens", async () => {
    await tester.compile(t.code`op \`get-data\`(): void;`);

    const GetDataOp = tester.program.getGlobalNamespaceType().operations.get("get-data")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateOperation(GetDataOp);

    expect(mutation.mutatedType.name).toBe("getData");
  });

  it("marks operation as nullable when return type is T | null", async () => {
    const { getUser } = await tester.compile(
      t.code`
        model ${t.model("User")} { name: string; }
        op ${t.op("getUser")}(): User | null;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateOperation(getUser);

    // The return type should be unwrapped to the inner type
    expect(mutation.mutatedType.returnType.kind).toBe("Model");
    // The operation itself should be marked nullable
    expect(isNullable(mutation.mutatedType)).toBe(true);
  });

  it("does not mark operation as nullable when return type is non-null", async () => {
    const { getUser } = await tester.compile(
      t.code`
        model ${t.model("User")} { name: string; }
        op ${t.op("getUser")}(): User;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateOperation(getUser);

    expect(mutation.mutatedType.returnType.kind).toBe("Model");
    expect(isNullable(mutation.mutatedType)).toBe(false);
  });
});
