import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

import { defineConfig } from "rollup";

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
    input: "test/suite.ts",
    output: {
      file: "dist/test/suite.js", // VSCode web will add extra .js if you use .cjs
      format: "commonjs",
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins: [...plugins, ts("dist/test")],
  },
]);

function ts(outDir: string) {
  return (typescript as any)({ tsconfig: "./tsconfig.build.json", outDir });
}
