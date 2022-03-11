import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 4000,
  },
  assetsInclude: [/\.cadl$/],
  optimizeDeps: {
    exclude: ["node-fetch"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
