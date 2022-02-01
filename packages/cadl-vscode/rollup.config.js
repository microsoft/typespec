import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import path from "path";

export default {
  input: "dist-dev/extension.js",
  output: {
    file: "dist/extension.js",
    format: "commonjs",
    sourcemap: true,
    exports: "default",
  },
  external: ["fs/promises", "vscode"],
  plugins: [resolve({ preferBuiltins: true }), commonjs()],
  onwarn: (warning, warn) => {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      // filter out warnings about circular dependencies out of our control
      for (const each of ["node_modules/semver"]) {
        if (warning.importer.includes(path.normalize(each))) {
          return;
        }
      }
    }
    warn(warning);
  },
};
