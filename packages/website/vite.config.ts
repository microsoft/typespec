import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 4000,
  },
  assetsInclude: [/\.cadl$/],
  optimizeDeps: {
    exclude: ["node-fetch"],
  },
  plugins: [
    react(),
    // playgroundManifestPlugin(config),
    // cadlBundlePlugin({
    //   folderName: "libs",
    //   libraries: config.libraries,
    // }),
  ],
  server: {
    fs: {
      strict: false,
    },
  },
});
