import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";

export default defineConfig({
  projects: [
    mergeConfig(
      defaultTypeSpecVitestConfig,
      defineConfig({
        name: "unit",
        test: {
          include: ["test/unit/**/*.test.ts"],
        },
      }),
    ),
    defineConfig({
      name: "extension", // 👈 添加 name 字段
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
