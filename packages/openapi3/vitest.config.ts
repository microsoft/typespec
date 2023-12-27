import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    isolate: false,
    outputFile: {
      junit: "./test-results.xml",
    },
    testTimeout: 10000,
  },
});
