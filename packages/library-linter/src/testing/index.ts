import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/**
 * Registers the library linter's package files with the legacy compiler test host.
 *
 * @deprecated Use `createTester` from `@typespec/compiler/testing` instead
 */
/* eslint-disable @typescript-eslint/no-deprecated */
export const LibraryLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/library-linter",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
