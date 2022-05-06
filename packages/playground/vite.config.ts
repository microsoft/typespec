import { cadlBundlePlugin } from "@cadl-lang/bundler";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 4000,
  },
  // assetsInclude: [/\.cadl$/],
  optimizeDeps: {
    exclude: ["node-fetch"],
  },
  plugins: [
    react(),
    cadlBundlePlugin({
      folderName: "libs",
      libraries: [
        "@cadl-lang/compiler",
        "@cadl-lang/rest",
        "@cadl-lang/openapi",
        "@cadl-lang/versioning",
        "@cadl-lang/openapi3",
      ],
    }),
  ],
  server: {
    fs: {
      strict: false,
    },
  },
});
