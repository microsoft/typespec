import alloyPlugin from "@alloy-js/rollup-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
      passWithNoTests: true,
    },
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    plugins: [alloyPlugin()],
  }),
);
