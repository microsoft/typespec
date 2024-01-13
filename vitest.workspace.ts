export default ["packages/*/vite.config.[m]ts"];

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
