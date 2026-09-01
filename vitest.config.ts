import { defineConfig, mergeConfig } from "vitest/config";

/**
 * Default Config For all TypeSpec projects using vitest.
 */
export const defaultTypeSpecVitestConfig = defineConfig({
  test: {
    environment: "node",
    isolate: false,
    coverage: {
      reporter: ["cobertura", "json", "text"],
    },
    outputFile: {
      junit: "./test-results.xml",
    },
    exclude: ["**/node_modules", "dist/**/*.test.*", "temp/**/*.test.*"],
    hideSkippedTests: true,
    server: {
      // tabster@8.8.0 ships `"type": "module"` with a CJS `main` and no `exports`
      // map, and its CJS build uses a getter-based `_export()` helper that
      // cjs-module-lexer can't statically analyze. Loaded as CJS, named imports
      // like `createTabster` (used by FluentUI) fail. Inlining the FluentUI +
      // tabster chain routes it through Vite so its ESM entry is used instead.
      deps: {
        inline: [/@fluentui\//, "tabster"],
      },
    },
  },
  server: {
    watch: {
      ignored: [],
    },
  },
});

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    test: {
      projects: [
        "packages/*/vitest.config.ts",
        "packages/*/vitest.config.mts",
        "eng/vitest.config.ts",
      ],
    },
  }),
);
