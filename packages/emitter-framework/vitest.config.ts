import alloyPlugin from "@alloy-js/rollup-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts", "src/**/*.test.tsx", "test/**/*.test.ts", "test/**/*.test.tsx"],
      passWithNoTests: true,
      setupFiles: ["./test/vitest.setup.ts"],
    },
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    plugins: [alloyPlugin()],
  }),
);
