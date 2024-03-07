import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const OpenAPITestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
