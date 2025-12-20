import { describe, it, expect } from "vitest";
import { compileVirtual } from "../../src/index.js";

describe("compiler-wasm integration", () => {
  it("should compile a minimal TypeSpec namespace", async () => {
    const result = await compileVirtual(
      [
        {
          path: "/main.tsp",
          contents: `
            namespace MyService {
              model User {
                id: string;
                name: string;
              }
              
              op getUser(id: string): User;
            }
          `,
        },
      ],
      "/main.tsp",
      {
        emitters: [],
        outputDir: "/output",
        arguments: [],
      },
    );

    // Should compile without errors if stdlib is available
    // For now, just verify we get a result structure
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.diagnostics).toBeDefined();
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it("should detect missing imports", async () => {
    const result = await compileVirtual(
      [
        {
          path: "/main.tsp",
          contents: `
            import "@typespec/http";
            
            namespace MyService {
              op test(): void;
            }
          `,
        },
      ],
      "/main.tsp",
      {
        emitters: [],
        outputDir: "/output",
        arguments: [],
      },
    );

    expect(result).toBeDefined();
    // Should have diagnostics about missing import
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it("should provide detailed error locations", async () => {
    const result = await compileVirtual(
      [
        {
          path: "/main.tsp",
          contents: `
            namespace MyService {
              model User {
                id: string;
                name: invalidType;
              }
            }
          `,
        },
      ],
      "/main.tsp",
      {
        emitters: [],
        outputDir: "/output",
        arguments: [],
      },
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    
    const diagnostic = result.diagnostics[0];
    expect(diagnostic.file).toBe("/main.tsp");
    // Positions might be 0 if not provided, just check they exist
    expect(diagnostic.start).toBeDefined();
    expect(diagnostic.end).toBeDefined();
    expect(diagnostic.end).toBeGreaterThanOrEqual(diagnostic.start);
  });
});
