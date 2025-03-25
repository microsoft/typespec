import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 90_000,
    isolate: false,
    coverage: {
      reporter: ["cobertura", "json", "text"],
    },
    outputFile: {
      junit: "./test-results.xml",
    },

    include: ["test/**/*.e2e.ts"],
  },
});
