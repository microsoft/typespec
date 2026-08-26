import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      exclude: [...configDefaults.exclude, "dist-dev/**/*"],
      testTimeout: 10_000,
    },
  }),
);
