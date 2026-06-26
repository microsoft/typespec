/* eslint-disable @typescript-eslint/no-deprecated */
import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const EventsTestLibrary = createTestLibrary({
  name: "@typespec/events",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
