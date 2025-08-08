import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const HttpClientTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-client",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
