import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const HttpClientTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
