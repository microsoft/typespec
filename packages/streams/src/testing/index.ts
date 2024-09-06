import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const StreamTestLibrary = createTestLibrary({
  name: "@typespec/streams",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
