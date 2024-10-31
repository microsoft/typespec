import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { dirname } from "path";

import { defineConfig } from "rollup";
import { fileURLToPath } from "url";
const projDir = dirname(fileURLToPath(import.meta.url));

const plugins = [(resolve as any)({ preferBuiltins: true }), (commonjs as any)()];
const baseConfig = defineConfig({
  input: "src/extension.ts",
  output: {
    file: "dist/src/extension.cjs",
    format: "commonjs",
    sourcemap: true,
    exports: "named",
  },
  external: ["vscode"],
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
    plugins: [...plugins, ts("dist/src")],
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
    plugins: [...plugins, ts("dist/src/web")],
  },
  {
    ...baseConfig,
    input: "test/web/suite.ts",
    output: {
      file: "dist/test/web/suite.js", // VSCode web will add extra .js if you use .cjs
      format: "commonjs",
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins: [...plugins, ts("dist/test/web")],
  },
]);

function ts(outDir: string) {
  return (typescript as any)({
    compilerOptions: {
      // set sourceRoot to absolute path, otherwise the path in the map file generated is incorrect when outDir is given
      sourceRoot: projDir,
    },
    tsconfig: "./tsconfig.build.json",
    outDir,
  });
}
