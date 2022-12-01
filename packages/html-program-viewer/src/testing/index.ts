import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const ProgramViewerTestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/html-program-viewer",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
