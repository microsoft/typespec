import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

const externals = [
  "url",
  "fs/promises",
  "@typespec/compiler",
  "react",
  "react-dom",
  "react-dom/server",
];

export default defineConfig({
  build: {
    target: "esnext",
    minify: false,
    chunkSizeWarningLimit: 3000,
    lib: {
      entry: {
        index: "src/index.ts",
      },
      formats: ["es"],
    },
    outDir: "dist/emitter",

    rollupOptions: {
      external: externals,
    },
  },
  plugins: [
    react(),
    checker({
      typescript: true,
    }),
  ],
});
