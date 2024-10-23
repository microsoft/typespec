import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const OpenAPI3TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi3",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
