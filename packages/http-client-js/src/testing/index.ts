import { resolvePath } from "@typespec/compiler";
import type { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { createTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const HttpClientJavascriptEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client-js",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../"),
});
