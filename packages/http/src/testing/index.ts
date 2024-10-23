import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const HttpTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
