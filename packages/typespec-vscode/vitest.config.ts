import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.workspace.js";
import path from "node:path";

export default defineConfig({
  projects: [
    // 单元测试配置（默认）
    mergeConfig(
      defaultTypeSpecVitestConfig,
      defineConfig({
        test: {
          include: ["test/unit/**/*.test.ts"],
        },
      }),
    ),
    // extension/E2E 测试配置（仅在 test:extension 命令下运行）
    defineConfig({
      root: "test/extension",
      test: {
        // 只会在 test/extension 目录下运行
        include: ["**/*.test.ts"],
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
