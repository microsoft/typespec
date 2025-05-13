import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

/** @deprecated use new Tester */
export const OpenAPI3TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi3",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
