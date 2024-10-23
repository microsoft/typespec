import { typespecBundlePlugin } from "@typespec/bundler/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({}),
    typespecBundlePlugin({
      folderName: "libs",
      libraries: ["@typespec/compiler"],
    }),
  ],
});
