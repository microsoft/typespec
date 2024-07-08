import react from "@vitejs/plugin-react";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");

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
    outDir: "dist/lib",

    rollupOptions: {
      external: (id) => {
        const normalized = id.replace(/\\/g, "/");
        return (
          normalized.includes("/node_modules/") ||
          !(normalized.startsWith(__dirname) || normalized.startsWith("."))
        );
      },
    },
  },
  plugins: [react({}), dts()],
});
