import { resolvePath } from "@typespec/compiler";
import { TypeSpecTestLibrary, createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPITestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
