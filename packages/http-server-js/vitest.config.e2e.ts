import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      environment: "node",
      testTimeout: 10_000,
      isolate: false,
      coverage: {
        reporter: ["cobertura", "json", "text"],
      },
      outputFile: {
        junit: "./test-results.xml",
      },
      include: ["test/**/*.e2e.ts"],
    },
  }),
);
