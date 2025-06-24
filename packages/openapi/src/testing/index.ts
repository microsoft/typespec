import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated use new Tester */
export const OpenAPITestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
