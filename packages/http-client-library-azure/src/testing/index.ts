import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const TypespecHttpClientLibraryAzureTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client-library-azure",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
