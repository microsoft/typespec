import { babel } from "@rollup/plugin-babel";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"],
      exclude: ["test/e2e/**/*"],
      passWithNoTests: true,
    },
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    plugins: [
      babel({
        sourceMaps: true,
        babelHelpers: "bundled",
        extensions: [".ts", ".tsx"],
        presets: ["@babel/preset-typescript", "@alloy-js/babel-preset"],
      }),
    ],
  }),
);
