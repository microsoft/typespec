import { defineConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace";

export default defineConfig({
  test: {
    ...defaultTypeSpecVitestConfig
    testTimeout: 10000,
    watchExclude: ["dist/**"],
  },
});
