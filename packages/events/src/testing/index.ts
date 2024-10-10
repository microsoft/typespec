import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const EventsTestLibrary = createTestLibrary({
  name: "@typespec/events",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
