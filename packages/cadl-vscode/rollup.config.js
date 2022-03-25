// @ts-check
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "dist-dev/src/extension.js",
  output: {
    file: "dist/src/extension.js",
    format: "commonjs",
    sourcemap: true,
    exports: "named",
  },
  external: ["fs/promises", "vscode"],
  plugins: [resolve({ preferBuiltins: true }), commonjs()],
  onwarn: (warning, warn) => {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      // filter out warnings about circular dependencies out of our control
      for (const each of ["node_modules/semver"]) {
        if (warning.importer.includes(each)) {
          return;
        }
      }
    }
    warn(warning);
  },
});
