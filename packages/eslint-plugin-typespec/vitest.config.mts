import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      setupFiles: ["./test/global-setup.ts"],
      testTimeout: 10_000,
    },
  }),
);
