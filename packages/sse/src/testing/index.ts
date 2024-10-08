import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const SSETestLibrary = createTestLibrary({
  name: "@typespec/sse",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
