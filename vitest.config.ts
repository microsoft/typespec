import { defineConfig, mergeConfig } from "vitest/config";

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
    exclude: ["**/node_modules", "dist/**/*.test.*", "temp/**/*.test.*"],
    hideSkippedTests: true,
  },
  server: {
    watch: {
      ignored: [],
    },
  },
});

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      projects: [
        "packages/*/vitest.config.ts",
        "packages/*/vitest.config.mts",
        "eng/vitest.config.ts",
      ],
    },
  }),
);
