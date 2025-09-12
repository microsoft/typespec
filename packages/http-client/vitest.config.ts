import alloyPlugin from "@alloy-js/rollup-plugin";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

const here = dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    // Give this package its own caches so other packages can’t “poison” it.
    cacheDir: join(here, "node_modules/.vitest-cache"),
    // If your tests don’t truly need DOM, keep node.
    test: {
      include: ["test/**/*.test.ts"],
      passWithNoTests: true,
      // Re-enable isolation for THIS package to stop cross-file leakage.
      isolate: true,
      // Stabilize runner while you confirm the fix (you can relax later).
      pool: "forks",
      maxWorkers: 1,
      deps: {
        // Treat sibling workspaces like source (don’t externalize dist)
        inline: [
          "@typespec/emitter-framework",
          "@typespec/react-components",
          "@typespec/html-program-viewer",
        ],
      },
      hookTimeout: 30_000,
      testTimeout: 60_000,
    },
    // Prevent Vite SSR from externalizing the siblings’ built output.
    ssr: {
      noExternal: [
        "@typespec/emitter-framework",
        "@typespec/react-components",
        "@typespec/html-program-viewer",
      ],
    },
    // (Recommended) Alias to sibling *src* so we never import their dist in tests.
    resolve: {
      alias: {
        "@typespec/emitter-framework": fileURLToPath(
          new URL("../emitter-framework/src/index.ts", import.meta.url),
        ),
        // Add more aliases if http-client imports others’ dist.
        // "@typespec/react-components": fileURLToPath(new URL("../react-components/src/index.ts", import.meta.url)),
      },
    },
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    plugins: [alloyPlugin()],
  }),
);
