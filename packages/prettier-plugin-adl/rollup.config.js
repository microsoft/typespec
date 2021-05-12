// @ts-check
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "commonjs",
    sourcemap: true,
    exports: "default",
  },
  context: "this",
  external: ["fs/promises", "prettier"],
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    replace({
      values: {
        "export const adlVersion = getVersion();": `export const adlVersion = "";`,
      },
      delimiters: ["", ""],
      preventAssignment: true,
    }),
  ],
};
