import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const JsonSchemaTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/json-schema",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
