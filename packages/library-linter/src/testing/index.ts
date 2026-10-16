import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/**
 * File mappings for loading the library linter into a legacy compiler test host.
 * Supply this descriptor through the host's `libraries` option; importing it does not load the library.
 *
 * @deprecated Use `createTester` from `@typespec/compiler/testing` instead
 */
/* eslint-disable @typescript-eslint/no-deprecated */
export const LibraryLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/library-linter",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
