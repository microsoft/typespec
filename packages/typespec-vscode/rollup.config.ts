import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import * as path from "path";

import { defineConfig } from "rollup";

/**
 * For web extension, all tests, including the test runner, need to be bundled into
 * a single module that has a exported `run` function .
 * This plugin bundles implements a virtual file extensionTests.ts that bundles all these together.
 * @type {import('esbuild').Plugin}
 */
const testBundlePlugin = {
  name: "testBundlePlugin",
  setup(build: any) {
    build.onResolve({ filter: /[/\\]suite\.ts$/ }, (args: any) => {
      if (args.kind === "entry-point") {
        return { path: path.resolve(args.path) };
      }
    });
    build.onLoad({ filter: /[/\\]suite\.ts$/ }, async (args: any) => {
      const testsRoot = path.join(__dirname, "test");
      const files = ["web.test.js"];
      return {
        contents:
          `export { run } from './mochaTestRunner.ts';` +
          files.map((f) => `import('./${f}');`).join(""),
        watchDirs: files.map((f) => path.dirname(path.resolve(testsRoot, f))),
        watchFiles: files.map((f) => path.resolve(testsRoot, f)),
      };
    });
  },
};

const baseConfig = defineConfig({
  input: "src/extension.ts",
  output: {
    file: "dist/src/extension.cjs",
    format: "commonjs",
    sourcemap: true,
    exports: "named",
    inlineDynamicImports: true,
  },
  external: ["fs/promises", "vscode"],
  plugins: [
    (resolve as any)({ preferBuiltins: true }),
    (commonjs as any)(),
    (json as any)(),
    (typescript as any)({ tsconfig: "./tsconfig.build.json" }),
  ],
  onwarn: (warning, warn) => {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      // filter out warnings about circular dependencies out of our control
      for (const each of ["node_modules/semver"]) {
        if (warning.message.includes(each)) {
          return;
        }
      }
    }
    warn(warning);
  },
});

export default defineConfig([
  {
    ...baseConfig,
    input: "src/extension.ts",
    output: {
      file: "dist/src/extension.cjs",
      format: "commonjs",
      sourcemap: true,
      exports: "named",
      inlineDynamicImports: true,
    },
  },
  {
    ...baseConfig,
    input: "src/web/extension.ts",
    output: {
      file: "dist/src/web/extension.js", // VSCode web will add extra .js if you use .cjs
      format: "commonjs",
      sourcemap: true,
      inlineDynamicImports: true,
    },
  },
  {
    ...baseConfig,
    input: "test/suite.ts",
    output: {
      file: "dist/test/suite.js", // VSCode web will add extra .js if you use .cjs
      format: "commonjs",
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins: [testBundlePlugin as any, ...(baseConfig.plugins as any)],
  },
]);
