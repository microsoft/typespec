import { defineConfig } from "vitest/config";

export default [
  "packages/*/vitest.config.ts",
  "packages/*/vitest.config.mts",
  "eng/vitest.config.ts",
];
/**
 * Default Config For all TypeSpec projects using vitest.
 */
export const defaultTypeSpecVitestConfig = defineConfig({
  test: {
    environment: "node",
    isolate: false,
    coverage: {
      reporter: ["cobertura", "json", "text"],
    },
    outputFile: {
      junit: "./test-results.xml",
    },
    watchExclude: [],
    exclude: ["node_modules", "dist/test"],
  },
});
