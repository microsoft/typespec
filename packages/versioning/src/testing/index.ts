import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const VersioningTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/versioning",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
