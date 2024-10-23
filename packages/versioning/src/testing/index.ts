import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const VersioningTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/versioning",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
