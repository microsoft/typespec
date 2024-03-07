// @ts-check
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.mjs",
  output: {
    file: "dist/index.js",
    format: "commonjs",
    sourcemap: true,
    exports: "default",
  },
  inlineDynamicImports: true,
  context: "this",
  external: ["fs/promises", "prettier"],
  treeshake: {
    // Ignore those 2 modules are they aren't used in the code needed for the formatter.
    // Otherwise rollup think they have side effect and to include a lot of unnecessary code in the bundle.
    moduleSideEffects: ["ajv"],
  },
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    replace({
      values: {
        "export const typespecVersion = getVersion();": `export const typespecVersion = "";`,
      },
      delimiters: ["", ""],
      preventAssignment: true,
    }),
  ],
});
