import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const VersioningTestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/versioning",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
