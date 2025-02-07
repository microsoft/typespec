import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../../vitest.workspace.js";
const isolate = defineConfig({
  test: {
    threads: false,
    isolate: false,
  },
});
export default mergeConfig(defaultTypeSpecVitestConfig, defineConfig({}), isolate);

