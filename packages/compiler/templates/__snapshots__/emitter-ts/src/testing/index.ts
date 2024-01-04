import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const EmitterTsTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "emitter-ts",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
