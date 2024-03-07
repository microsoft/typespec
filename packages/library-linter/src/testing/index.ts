import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const LibraryLinterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/library-linter",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
