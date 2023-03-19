import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const JsonSchemaTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/json-schema",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
