import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "emitter-ts",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
