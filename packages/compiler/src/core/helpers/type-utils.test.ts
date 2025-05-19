import { Interface, Model, Namespace, Operation } from "../types.js";
import { createTestHost, TestHost } from "../../testing/index.js";
import { listTypesUnder } from "./type-utils.js";

let host: TestHost;

beforeEach(async () => {
  host = await createTestHost();
});

it("lists all types in a namespace", async () => {
  const testCode = `
    namespace A {
      model M1 {}
      model M2 {}
    }
  `;

  const { A } = (await host.compile(testCode)) as { A: Namespace };
  const types = listTypesUnder(A, (t) => true);
  
  // Should include 2 models plus namespace A
  expect(types.length).toBe(3);
});

it("filters models", async () => {
  const testCode = `
    namespace A {
      model M1 {}
      model M2 {}
      scalar S {}
    }
  `;

  const { A } = (await host.compile(testCode)) as { A: Namespace };
  const models = listTypesUnder(A, (t): t is Model => t.kind === "Model");
  
  expect(models.length).toBe(2);
  expect(models.every(m => m.kind === "Model")).toBe(true);
});

it("handles nested namespaces", async () => {
  const testCode = `
    namespace A {
      model M1 {}
      
      namespace B {
        model M2 {}
      }
    }
  `;

  const { A } = (await host.compile(testCode)) as { A: Namespace };
  const models = listTypesUnder(A, (t): t is Model => t.kind === "Model");
  
  expect(models.length).toBe(2);
});

it("handles interfaces and operations", async () => {
  const testCode = `
    namespace A {
      interface I1 {
        op1(): void;
        op2(): string;
      }
    }
  `;

  const { A } = (await host.compile(testCode)) as { A: Namespace };
  const operations = listTypesUnder(A, (t): t is Operation => t.kind === "Operation");
  const interfaces = listTypesUnder(A, (t): t is Interface => t.kind === "Interface");
  
  expect(operations.length).toBe(2);
  expect(interfaces.length).toBe(1);
});

it("respects recursive option", async () => {
  const testCode = `
    namespace A {
      model M1 {}
      
      namespace B {
        model M2 {}
        
        namespace C {
          model M3 {}
        }
      }
    }
  `;

  const { A } = (await host.compile(testCode)) as { A: Namespace };
  
  // With recursive = true (default)
  const allModels = listTypesUnder(A, (t): t is Model => t.kind === "Model");
  expect(allModels.length).toBe(3);
  
  // With recursive = false
  const topLevelModels = listTypesUnder(A, (t): t is Model => t.kind === "Model", { recursive: false });
  expect(topLevelModels.length).toBe(1);
  expect(topLevelModels[0].name).toBe("M1");
});