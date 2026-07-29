import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

/** @deprecated use new Tester */
/* eslint-disable @typescript-eslint/no-deprecated */
export const OpenAPI3TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi3",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
