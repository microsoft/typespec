import alloyPlugin from "@alloy-js/rollup-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"],
      passWithNoTests: true,
      testTimeout: 30000,
    },
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    plugins: [alloyPlugin()],
  }),
);
