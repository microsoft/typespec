import { createTestLibrary } from "@typespec/compiler/testing";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use createTestLibrary helper which properly handles the types
export const TypeSpecMcp = createTestLibrary({
  name: "@typespec/mcp",
  packageRoot: path.resolve(__dirname, "../.."),
});
