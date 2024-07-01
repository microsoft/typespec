import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

const externals = [
  "url",
  "@typespec/compiler",
  "react",
  "react-dom",
  "react-dom/server",
  // "@fluentui/react-components",
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
