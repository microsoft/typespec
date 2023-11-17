import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { defineConfig } from "rollup";
// To handle css files
import postcss from "rollup-plugin-postcss";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json")).toString());
const dependencies = Object.keys(packageJson.dependencies);
const external = [
  ...dependencies,
  "swagger-ui-react/swagger-ui.css",
  "@emotion/react/jsx-runtime",
  "@typespec/bundler/vite",
  "react-dom/client",
  "vite",
  "@vitejs/plugin-react",
  "fs/promises",
];
export default defineConfig([
  {
    input: {
      index: "src/index.ts",
      "react/index": "src/react/index.ts",
      "react/viewers/index": "src/react/viewers/index.tsx",
      "tooling/index": "src/tooling/index.ts",
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
        tsconfig: "./tsconfig.build.json",
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
