import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const RestTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/rest",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
