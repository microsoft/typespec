import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(defaultTypeSpecVitestConfig, defineConfig({}));
