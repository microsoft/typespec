import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 3000,
  },
  esbuild: {
    target: "esnext",
  },
  plugins: [
    (react as any)({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    visualizer({
      template: "treemap", // or sunburst
      // open: true,
      gzipSize: true,
      filename: "temp/bundle-size.html",
    }),
  ],
});
