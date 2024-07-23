import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const SampleEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "emitter-sample",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});
