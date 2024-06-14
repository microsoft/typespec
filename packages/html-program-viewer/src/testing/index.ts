import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const ProgramViewerTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/html-program-viewer",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
