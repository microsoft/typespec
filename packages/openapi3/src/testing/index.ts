import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPI3TestLibrary: CadlTestLibrary = createTestLibrary({
  name: "@cadl-lang/openapi3",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
