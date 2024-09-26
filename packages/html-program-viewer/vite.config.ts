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
const externals = ["url", ...dependencies];

export default defineConfig({
  build: {
    target: "esnext",
    minify: false,
    chunkSizeWarningLimit: 3000,
    lib: {
      entry: {
        "react/index": "src/react/index.ts",
      },
      formats: ["es"],
    },

    rollupOptions: {
      external: externals,
    },
  },
  plugins: [
    react(),
    dts({
      logLevel: "silent", // checker reports the errors
      tsconfigPath: "./tsconfig.build.json",
    }),
    checker({
      typescript: {
        tsconfigPath: "./tsconfig.build.json",
      },
    }),
  ],
});
