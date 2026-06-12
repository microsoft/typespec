import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const StreamsTestLibrary = createTestLibrary({
  name: "@typespec/streams",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
