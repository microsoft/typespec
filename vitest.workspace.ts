export default ["packages/*/vitest.config.ts", "packages/*/vitest.config.mts"];

/**
 * Default Config For all typespec projects using vitest.
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
};
