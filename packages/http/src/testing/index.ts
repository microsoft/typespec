import type { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
/* eslint-disable @typescript-eslint/no-deprecated */
export const HttpTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
