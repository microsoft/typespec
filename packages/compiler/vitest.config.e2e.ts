import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60_000,
    isolate: false,
    outputFile: {
      junit: "./test-results.xml",
    },

    include: ["test/**/*.e2e.ts"],
  },
});
