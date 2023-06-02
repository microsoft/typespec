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
  plugins: [
    (react as any)({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
  ],
  server: {
    fs: {
      strict: false,
    },
  },
});

export default config;
