import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // testTimeout: 10000, // Uncomment to increase the default timeout
    isolate: false, // Your test shouldn't have side effects to this will improve performance.
  },
});
