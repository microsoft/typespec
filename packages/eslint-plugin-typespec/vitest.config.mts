import { defineConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace";

export default defineConfig({
  test: {
    ...defaultTypeSpecVitestConfig
    setupFiles: ["./test/global-setup.ts"],
  },
});
