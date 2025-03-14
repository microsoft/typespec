import type { Operation } from "@typespec/compiler";
import { expectDiagnostics, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { compileAndDiagnose } from "./test-host.js";
import { getOperationKind } from "../src/lib/operation-kind.js";

describe("Operation kinds", () => {
  it("declares a Mutation", async () => {
    const [program, { testOperation, }, diagnostics] = await compileAndDiagnose<{
      testOperation: Operation;
    }>(`
      @mutation @test op testOperation(): string;
    `);
    expectDiagnosticEmpty(diagnostics);
    const operationKind = getOperationKind(program, testOperation);
    expect(operationKind).toBe("Mutation");
  });
  it("declares a Query", async () => {
    const [program, { testOperation, }, diagnostics] = await compileAndDiagnose<{
      testOperation: Operation;
    }>(`
      @query @test op testOperation(): string;
    `);
    expectDiagnosticEmpty(diagnostics);
    const operationKind = getOperationKind(program, testOperation);
    expect(operationKind).toBe("Query");
  });
  it("declares a Subscription", async () => {
    const [program, { testOperation, }, diagnostics] = await compileAndDiagnose<{
      testOperation: Operation;
    }>(`
      @subscription @test op testOperation(): string;
    `);
    expectDiagnosticEmpty(diagnostics);
    const operationKind = getOperationKind(program, testOperation);
    expect(operationKind).toBe("Subscription");
  }); 
  it("does not allow to declare multiple operation kinds to the same type.", async () => {
    const [program, { testOperation, }, diagnostics] = await compileAndDiagnose<{
      testOperation: Operation;
    }>(`
      @query @mutation @test op testOperation(): string;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/graphql-operation-kind-duplicate",
      message: "GraphQL Operation Kind already applied to `testOperation`.",
    });
    const operationKind = getOperationKind(program, testOperation);
    expect(operationKind).toBe("Mutation");
  });
});
