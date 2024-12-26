import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: ["dist/test/suite/*.test.cjs","dist/test/unit/*.test.cjs"], // 
});
