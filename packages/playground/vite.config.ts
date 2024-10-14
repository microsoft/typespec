import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json")).toString());
const dependencies = Object.keys(packageJson.dependencies);
const externals = [
  ...dependencies,
  "swagger-ui-dist/swagger-ui-es-bundle.js",
  "swagger-ui-dist/swagger-ui.css",
  "@typespec/bundler/vite",
  "react-dom/client",
  "react/jsx-runtime",
  "vite",
  "@vitejs/plugin-react",
  "fs/promises",
];

export default defineConfig({
  build: {
    target: "esnext",
    minify: false,
    chunkSizeWarningLimit: 3000,
    lib: {
      entry: {
        index: "src/index.ts",
        "state-storage": "src/state-storage.ts",
        "react/index": "src/react/index.ts",
        "react/viewers/index": "src/react/viewers/index.tsx",
        "tooling/index": "src/tooling/index.ts",
        "vite/index": "src/vite/index.ts",
      },
      formats: ["es"],
    },

    rollupOptions: {
      external: (id) => externals.some((x) => id.startsWith(x)),
    },
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  assetsInclude: [/\.tsp$/],
  optimizeDeps: {},
  plugins: [
    react({}),
    dts({
      logLevel: "silent", // checker reports the errors
    }),
    checker({
      // e.g. use TypeScript check
      typescript: true,
    }),
  ],
  server: {
    fs: {
      strict: false,
    },
  },
});
