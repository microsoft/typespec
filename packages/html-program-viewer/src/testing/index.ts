import { resolvePath } from "@typespec/compiler";
import { TypeSpecTestLibrary, createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const ProgramViewerTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/html-program-viewer",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
