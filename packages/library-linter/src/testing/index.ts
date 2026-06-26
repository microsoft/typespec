/* eslint-disable @typescript-eslint/no-deprecated */
import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const LibraryLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/library-linter",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
