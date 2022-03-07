// @ts-check
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

export default {
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
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    replace({
      values: {
        "export const cadlVersion = getVersion();": `export const cadlVersion = "";`,
      },
      delimiters: ["", ""],
      preventAssignment: true,
    }),
  ],
};
