import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const CSharpServiceEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/service-generator-csharp",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
