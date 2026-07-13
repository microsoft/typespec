import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated use new Tester */
/* eslint-disable @typescript-eslint/no-deprecated */
export const OpenAPITestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/openapi",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
