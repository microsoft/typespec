import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const RestTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/rest",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
