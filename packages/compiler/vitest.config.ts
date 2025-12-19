import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      exclude: [...defaultTypeSpecVitestConfig.test!.exclude!, "templates/**"],
      testTimeout: 10_000,
    },
  }),
);
