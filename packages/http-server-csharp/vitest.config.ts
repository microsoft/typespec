import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      testTimeout: 100_000,
      include: ["test/**/*.test.ts"],
      exclude: ["src/cli/*.ts"],
    },
  }),
);
