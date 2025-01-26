import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const CSharpServiceEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-server-csharp",
  packageRoot: await findTestPackageRoot(import.meta.url),
  jsFileFolder: "dist/src/lib",
});
