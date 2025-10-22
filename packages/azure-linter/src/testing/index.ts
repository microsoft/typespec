import { resolvePath } from "@typespec/compiler";
import {
  createTestLibrary,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const AzureLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "azure-linter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
