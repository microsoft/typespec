import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const HttpTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
