import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const HttpClientJavascriptEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "http-client-javascript",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});
