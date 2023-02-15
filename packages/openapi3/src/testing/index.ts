import { resolvePath } from "@typespec/compiler";
import { TypeSpecTestLibrary, createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPI3TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi3",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
