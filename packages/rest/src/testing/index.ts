import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const RestTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/rest",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
