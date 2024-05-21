export default [
  "packages/*/vitest.config.ts",
  "packages/*/vitest.config.mts",
  "eng/vitest.config.ts",
];

/**
 * Default Config For all TypeSpec projects using vitest.
 */
export const defaultTypeSpecVitestConfig = {
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
  },
  build: {
    outDir: "dummy", // Workaround for bug https://github.com/vitest-dev/vitest/issues/5429
  },
};
