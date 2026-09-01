import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
/* eslint-disable @typescript-eslint/no-deprecated */
export const VersioningTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/versioning",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
/* eslint-enable @typescript-eslint/no-deprecated */
