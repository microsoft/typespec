import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

import { defineConfig } from "rollup";

export default defineConfig({
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
