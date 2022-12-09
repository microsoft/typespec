import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const RestTestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/rest",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
