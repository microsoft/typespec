import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const TypespecHttpClientLibraryTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client-library",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
