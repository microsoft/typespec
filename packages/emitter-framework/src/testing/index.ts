import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/emitter-framework",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});
