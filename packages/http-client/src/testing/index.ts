import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const HttpClientTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
