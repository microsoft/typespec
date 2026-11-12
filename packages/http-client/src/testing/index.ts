import { resolvePath } from "@typespec/compiler";
import type { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const HttpClientTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
