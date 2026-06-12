import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const HttpTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
