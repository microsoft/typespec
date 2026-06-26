/* eslint-disable @typescript-eslint/no-deprecated */
import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const JsonSchemaTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/json-schema",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
