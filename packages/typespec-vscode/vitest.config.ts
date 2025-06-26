import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";
import path from "node:path";

export default defineConfig({
  projects: [
    mergeConfig(
      defaultTypeSpecVitestConfig,
      defineConfig({
        test: {
          include: ["test/unit/**/*.test.ts"],
        },
      }),
    ),
    defineConfig({
      test: {
        include: ["test/extension/**/*.test.ts"],
        testTimeout: process.env.CI ? 240_000 : Number.POSITIVE_INFINITY,
        fileParallelism: false,
        env: {
          VSCODE_E2E_EXTENSION_PATH: "./",
          VSCODE_E2E_TRACE: "on",
        },
        globalSetup: [path.resolve(__dirname, "test/extension/common/downloadSetup.ts")],
        retry: 1,
      },
    }),
  ],
});
