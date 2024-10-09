import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const StreamsTestLibrary = createTestLibrary({
  name: "@typespec/streams",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
