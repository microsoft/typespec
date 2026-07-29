import alloyPlugin from "@alloy-js/rollup-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    // Disable oxc transform to use babel (via alloyPlugin) for JSX
    oxc: false,
    plugins: [alloyPlugin()],
    resolve: {
      conditions: ["development"],
      dedupe: ["@alloy-js/core", "graphql"],
    },
  }),
);
