import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    isolate: false,
    setupFiles: ["./test/global-setup.ts"],
  },
});
