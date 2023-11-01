import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
// To handle css files
import postcss from "rollup-plugin-postcss";

import packageJson from "./package.json" assert { type: "json" };
const dependencies = Object.keys(packageJson.dependencies);
const optionalDependencies = Object.keys(packageJson.optionalDependencies);
const external = [
  ...dependencies,
  ...optionalDependencies,
  "swagger-ui-react/swagger-ui.css",
  "@emotion/react/jsx-runtime",
  "@typespec/bundler/vite",
  "react-dom/client",
];
export default defineConfig([
  {
    input: {
      index: "src/index.ts",
      "react/index": "src/react/index.ts",
      "react/viewers": "src/react/viewers.tsx",
      "vite/index": "src/vite/index.ts",
    },
    treeshake: false,
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      // preserveModules: true,
      // preserveModulesRoot: ".",
      exports: "named",
    },
    plugins: [
      (commonjs as any)(),
      (typescript as any)({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        sourceMap: true,
        inlineSources: true,
      }),
      (postcss as any)({
        extract: true,
      }),
    ],
    external,
  },
]);
