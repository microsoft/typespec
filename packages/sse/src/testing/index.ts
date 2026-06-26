/* eslint-disable @typescript-eslint/no-deprecated */
import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const SSETestLibrary = createTestLibrary({
  name: "@typespec/sse",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
