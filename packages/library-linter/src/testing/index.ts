import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const LibraryLinterTestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/library-linter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
