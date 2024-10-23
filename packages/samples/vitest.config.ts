import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 10000,
    isolate: false,
    coverage: {
      reporter: ["cobertura", "json", "text"],
    },
    outputFile: {
      junit: "./test-results.xml",
    },
  },
});
