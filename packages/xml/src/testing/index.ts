import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const XmlTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/xml",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
