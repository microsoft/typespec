import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const XmlTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/xml",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
