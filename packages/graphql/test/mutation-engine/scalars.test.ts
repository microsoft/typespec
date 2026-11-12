import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { getSpecifiedBy } from "../../src/lib/specified-by.js";
import { createGraphQLMutationEngine } from "../../src/mutation-engine/index.js";
import { Tester } from "../test-host.js";

function createTestEngine(program: Parameters<typeof createGraphQLMutationEngine>[0]) {
  return createGraphQLMutationEngine(program);
}

describe("GraphQL Mutation Engine - Scalars", () => {
  let tester: TesterInstance;
  beforeEach(async () => {
    tester = await Tester.createInstance();
  });

  it("leaves valid scalar names alone", async () => {
    const { ValidScalar } = await tester.compile(
      t.code`scalar ${t.scalar("ValidScalar")} extends string;`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(ValidScalar);

    expect(mutation.mutatedType.name).toBe("ValidScalar");
  });

  it("renames invalid scalar names", async () => {
    await tester.compile(t.code`scalar ${t.scalar("$Invalid$")} extends string;`);

    const InvalidScalar = tester.program.getGlobalNamespaceType().scalars.get("$Invalid$")!;
    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(InvalidScalar);

    expect(mutation.mutatedType.name).toBe("_Invalid");
  });

  it("has no @specifiedBy when decorator is not applied", async () => {
    const { MyScalar } = await tester.compile(
      t.code`scalar ${t.scalar("MyScalar")} extends string;`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyScalar);

    expect(getSpecifiedBy(tester.program, mutation.mutatedType)).toBeUndefined();
  });

  it("applies @specifiedBy from decorator to mutated scalar", async () => {
    const { MyScalar } = await tester.compile(
      t.code`
        @specifiedBy("https://example.com/my-scalar-spec")
        scalar ${t.scalar("MyScalar")} extends string;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyScalar);

    expect(getSpecifiedBy(tester.program, mutation.mutatedType)).toBe(
      "https://example.com/my-scalar-spec",
    );
  });

  it("inherits @specifiedBy from mapped ancestor via extends chain", async () => {
    const { MyDate } = await tester.compile(
      t.code`
        @encode("rfc3339")
        scalar ${t.scalar("MyDate")} extends utcDateTime;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyDate);

    // User-defined name is preserved (sanitized), not replaced with mapping's graphqlName
    expect(mutation.mutatedType.name).toBe("MyDate");
    // @specifiedBy inherited from utcDateTime's rfc3339 mapping
    expect(getSpecifiedBy(tester.program, mutation.mutatedType)).toBe(
      "https://scalars.graphql.org/chillicream/date-time.html",
    );
  });

  it("strips baseScalar from user-defined scalars", async () => {
    const { MyScalar } = await tester.compile(
      t.code`scalar ${t.scalar("MyScalar")} extends string;`,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyScalar);

    expect(mutation.mutatedType.baseScalar).toBeUndefined();
  });

  it("explicit @specifiedBy wins over inherited mapping", async () => {
    const { MyDate } = await tester.compile(
      t.code`
        @encode("rfc3339")
        @specifiedBy("https://example.com/custom-spec")
        scalar ${t.scalar("MyDate")} extends utcDateTime;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyDate);

    expect(getSpecifiedBy(tester.program, mutation.mutatedType)).toBe(
      "https://example.com/custom-spec",
    );
  });

  it("maps scalar extending GraphQL.ID to built-in ID type", async () => {
    const { MyId } = await tester.compile(t.code`scalar ${t.scalar("MyId")} extends GraphQL.ID;`);

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(MyId);

    expect(mutation.mutatedType.name).toBe("ID");
  });

  it("maps multi-hop extends chain through GraphQL.ID to built-in ID type", async () => {
    const { SubId } = await tester.compile(
      t.code`
        scalar MyId extends GraphQL.ID;
        scalar ${t.scalar("SubId")} extends MyId;
      `,
    );

    const engine = createTestEngine(tester.program);
    const mutation = engine.mutateScalar(SubId);

    expect(mutation.mutatedType.name).toBe("ID");
  });

  it("does not rename builtin std scalars even when they inherit a mapping", async () => {
    // float32 inherits a mapping via float → numeric → "Numeric", but it's a
    // GraphQL builtin (maps to Float) and must never be renamed.
    const { M } = await tester.compile(t.code`model ${t.model("M")} { value: float32; }`);

    const engine = createTestEngine(tester.program);
    const float32Scalar = M.properties.get("value")!.type;
    expect(float32Scalar.kind).toBe("Scalar");
    const mutation = engine.mutateScalar(float32Scalar as any);

    expect(mutation.mutatedType.name).toBe("float32");
  });

  it("does not rename float64 builtin scalar", async () => {
    const { M } = await tester.compile(t.code`model ${t.model("M")} { value: float64; }`);

    const engine = createTestEngine(tester.program);
    const float64Scalar = M.properties.get("value")!.type;
    expect(float64Scalar.kind).toBe("Scalar");
    const mutation = engine.mutateScalar(float64Scalar as any);

    expect(mutation.mutatedType.name).toBe("float64");
  });

  it("does not rename int32 builtin scalar", async () => {
    const { M } = await tester.compile(t.code`model ${t.model("M")} { count: int32; }`);

    const engine = createTestEngine(tester.program);
    const int32Scalar = M.properties.get("count")!.type;
    expect(int32Scalar.kind).toBe("Scalar");
    const mutation = engine.mutateScalar(int32Scalar as any);

    expect(mutation.mutatedType.name).toBe("int32");
  });

  it("does not rename std scalars like int64 - fallback mapping is applied at print time", async () => {
    const { M } = await tester.compile(t.code`model ${t.model("M")} { big: int64; }`);

    const engine = createTestEngine(tester.program);
    const int64Scalar = M.properties.get("big")!.type;
    expect(int64Scalar.kind).toBe("Scalar");
    const mutation = engine.mutateScalar(int64Scalar as any);

    // Std scalars keep their original name; fallback mapping (int64 → String) is applied in resolveGraphQLTypeName
    expect(mutation.mutatedType.name).toBe("int64");
  });

  it("warns when user-defined scalar collides with GraphQL built-in name", async () => {
    const { Float } = await tester.compile(t.code`scalar ${t.scalar("Float")} extends string;`);

    const engine = createTestEngine(tester.program);
    engine.mutateScalar(Float);

    const warnings = tester.program.diagnostics.filter(
      (d) => d.code === "@typespec/graphql/graphql-builtin-scalar-collision",
    );
    expect(warnings.length).toBe(1);
    expect(warnings[0].message).toContain("Float");
  });
});
