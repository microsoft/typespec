import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  base: "./",
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["monaco-editor"],
        },
      },
    },
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  assetsInclude: [/\.tsp$/],
  optimizeDeps: {
    exclude: ["swagger-ui"],
  },
  plugins: [react({})],
  server: {
    fs: {
      strict: false,
    },
  },
});

export default config;
