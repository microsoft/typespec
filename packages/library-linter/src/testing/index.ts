import { resolvePath } from "@typespec/compiler";
import { TypeSpecTestLibrary, createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const LibraryLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/library-linter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
