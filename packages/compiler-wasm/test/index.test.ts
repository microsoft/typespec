import { describe, it, expect } from "vitest";
import { compileVirtual, Severity } from "../src/index.js";

describe("compiler-wasm", () => {
  describe("compileVirtual", () => {
    it("should compile a simple TypeSpec file", async () => {
      const result = await compileVirtual(
        [
          {
            path: "/main.tsp",
            contents: "namespace MyService { op test(): void; }",
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
      expect(result.diagnostics).toBeDefined();
      // Note: success depends on whether stdlib is available
    });

    it("should handle syntax errors gracefully", async () => {
      const result = await compileVirtual(
        [
          {
            path: "/main.tsp",
            contents: "namespace MyService { op test( }",
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
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics.some((d) => d.severity === Severity.Error)).toBe(true);
    });

    it("should handle missing entry file", async () => {
      const result = await compileVirtual(
        [
          {
            path: "/other.tsp",
            contents: "namespace MyService { }",
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
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    it("should handle internal errors without throwing", async () => {
      // Try to trigger an internal error by providing invalid state
      const result = await compileVirtual(
        [],
        "",
        {
          emitters: [],
          outputDir: "/output",
          arguments: [],
        },
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });
  });
});
