import alloyPlugin from "@alloy-js/rollup-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import { defaultTypeSpecVitestConfig } from "../../vitest.config.js";

export default mergeConfig(
  defaultTypeSpecVitestConfig,
  defineConfig({
    esbuild: {
      jsx: "preserve",
      sourcemap: "both",
    },
    // Disable oxc transform to use babel (via alloyPlugin) for JSX
    oxc: false,
    plugins: [alloyPlugin()],
    resolve: {
      conditions: ["development"],
      dedupe: ["@alloy-js/core", "graphql"],
    },
    ssr: {
      // Force `graphql` (and packages that depend on it) through Vite's module graph instead of
      // Node's native resolver, so all consumers share the exact same `graphql` module instance.
      // Without this, `@pinterest/alloy-graphql`'s own `graphql` import can resolve through a
      // different ESM/CJS entry point than the emitter's, producing two distinct classes and
      // "Cannot use GraphQL*Type from another module or realm" errors even though both point at
      // the very same installed version.
      noExternal: ["graphql", "@pinterest/alloy-graphql"],
    },
  }),
);
