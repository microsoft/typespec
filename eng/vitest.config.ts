import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../vitest.workspace.js";

export default mergeConfig(defaultTypeSpecVitestConfig, defineConfig({}));
