import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const TypespecHttpClientTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
