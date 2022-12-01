import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPITestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/openapi",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
