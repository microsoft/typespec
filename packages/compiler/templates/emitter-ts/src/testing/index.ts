import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "{{name}}",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
