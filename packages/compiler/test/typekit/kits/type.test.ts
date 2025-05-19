import { Test, TestHost, createTestHost } from "../../../src/testing/index.js";
import { Model, Namespace } from "../../../src/core/types.js";

describe("listUnder", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  it("lists all types under a namespace", async () => {
    const testCode = `
      namespace A {
        model M1 {}
        model M2 {}
        
        @doc("Some doc")
        model M3 {}
      }
    `;

    const { A } = (await host.compile(testCode)) as { A: Namespace };
    const types = host.program.typespecType.listUnder(A, t => true);
    
    // Should include all 3 models plus the namespace itself when filter is 'true'
    expect(types.length).toBe(4);
  });

  it("filters types with the provided filter function", async () => {
    const testCode = `
      namespace A {
        model M1 {}
        
        @doc("Some doc")
        model M2 {}
        
        @deprecated
        model M3 {}
      }
    `;

    const { A } = (await host.compile(testCode)) as { A: Namespace };
    
    // Filter only models with @doc decorator
    const types = host.program.typespecType.listUnder(A, t => {
      return t.kind === "Model" && !!t.decorators.find(d => d.decorator.name === "@doc");
    });
    
    expect(types.length).toBe(1);
    expect((types[0] as Model).name).toBe("M2");
  });
  
  it("recursively searches sub-namespaces", async () => {
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
    
    // Should find all models in all namespaces
    const types = host.program.typespecType.listUnder(A, t => t.kind === "Model");
    
    expect(types.length).toBe(3);
  });
  
  it("finds operations in interfaces", async () => {
    const testCode = `
      namespace A {
        interface I1 {
          op1(): void;
          op2(): string;
        }
      }
    `;

    const { A } = (await host.compile(testCode)) as { A: Namespace };
    
    // Should find both operations
    const types = host.program.typespecType.listUnder(A, t => t.kind === "Operation");
    
    expect(types.length).toBe(2);
  });
});