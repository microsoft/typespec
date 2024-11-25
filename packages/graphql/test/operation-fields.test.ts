import type { Model, Operation } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOperationFields } from "../src/lib/operation-fields.js";
import { compileAndDiagnose, diagnose } from "./test-host.js";

describe("@operationFields", () => {
  it("can add an operation to the model", async () => {
    const [program, { TestModel, testOperation }, diagnostics] = await compileAndDiagnose<{
      TestModel: Model;
      testOperation: Operation;
    }>(`
      @test op testOperation(): void;

      @operationFields(testOperation)
      @test model TestModel {}
    `);
    expectDiagnosticEmpty(diagnostics);

    expect(getOperationFields(program, TestModel)).toContain(testOperation);
  });

  it("can add an interface to the model", async () => {
    const [program, { TestModel, testOperation }, diagnostics] = await compileAndDiagnose<{
      TestModel: Model;
      testOperation: Operation;
    }>(`
      interface TestInterface {
        @test op testOperation(): void;
      }

      @operationFields(TestInterface)
      @test model TestModel {}
    `);
    expectDiagnosticEmpty(diagnostics);

    expect(getOperationFields(program, TestModel)).toContain(testOperation);
  });

  it("can add an multiple operations to the model", async () => {
    const [program, { TestModel, testOperation1, testOperation2, testOperation3 }, diagnostics] =
      await compileAndDiagnose<{
        TestModel: Model;
        testOperation1: Operation;
        testOperation2: Operation;
        testOperation3: Operation;
      }>(`
      interface TestInterface {
        @test op testOperation1(): void;
        @test op testOperation2(): void;
      }

      @test op testOperation3(): void;

      @operationFields(TestInterface, testOperation3)
      @test model TestModel {}
    `);
    expectDiagnosticEmpty(diagnostics);

    expect(getOperationFields(program, TestModel)).toContain(testOperation1);
    expect(getOperationFields(program, TestModel)).toContain(testOperation2);
    expect(getOperationFields(program, TestModel)).toContain(testOperation3);
  });

  it("will add duplicate operations with a warning", async () => {
    const [program, { TestModel, testOperation }, diagnostics] = await compileAndDiagnose<{
      TestModel: Model;
      testOperation: Operation;
    }>(`
      interface TestInterface {
        @test op testOperation(): void;
      }

      @operationFields(TestInterface, TestInterface.testOperation)
      @test model TestModel {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/operation-field-duplicate",
      message: "Operation `testOperation` is defined multiple times on `TestModel`.",
    });

    expect(getOperationFields(program, TestModel)).toContain(testOperation);
  });

  describe("conflicts", () => {
    it("does not allow adding operations that conflict with a field", async () => {
      const diagnostics = await diagnose(`
        op foo(): void;
  
        @operationFields(foo)
        model TestModel {
          foo: string;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/operation-field-conflict",
        message: "Operation `foo` conflicts with an existing property on model `TestModel`.",
      });
    });

    it("does not allow adding operations that conflict with another operation in return type", async () => {
      const diagnostics = await diagnose(`
        op testOperation(): string;
  
        interface TestInterface {
          op testOperation(): void;
        }
  
        @operationFields(testOperation, TestInterface.testOperation)
        model TestModel {}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/operation-field-conflict",
        message:
          "Operation `testOperation` conflicts with an existing operation on model `TestModel`.",
      });
    });

    it("does not allow adding operations that conflict with another operation in number of arguments", async () => {
      const diagnostics = await diagnose(`
        op testOperation(a: string, b: integer): void;
  
        interface TestInterface {
          op testOperation(a: string): void;
        }
  
        @operationFields(testOperation, TestInterface.testOperation)
        model TestModel {}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/operation-field-conflict",
        message:
          "Operation `testOperation` conflicts with an existing operation on model `TestModel`.",
      });
    });

    it("does not allow adding operations that conflict with another operation in argument type", async () => {
      const diagnostics = await diagnose(`
        op testOperation(a: string): void;
  
        interface TestInterface {
          op testOperation(a: integer): void;
        }
  
        @operationFields(testOperation, TestInterface.testOperation)
        model TestModel {}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/operation-field-conflict",
        message:
          "Operation `testOperation` conflicts with an existing operation on model `TestModel`.",
      });
    });

    it("does not allow adding operations that conflict with another operation in argument name", async () => {
      const diagnostics = await diagnose(`
        op testOperation(a: string): void;
  
        interface TestInterface {
          op testOperation(b: string): void;
        }
  
        @operationFields(testOperation, TestInterface.testOperation)
        model TestModel {}
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/operation-field-conflict",
        message:
          "Operation `testOperation` conflicts with an existing operation on model `TestModel`.",
      });
    });

    it("allows adding operations with a different argument order", async () => {
      const diagnostics = await diagnose(`
        op testOperation(a: string, b: integer): void;
  
        interface TestInterface {
          op testOperation(b: integer, a: string): void;
        }
  
        @operationFields(testOperation, TestInterface.testOperation)
        model TestModel {}
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });
});
