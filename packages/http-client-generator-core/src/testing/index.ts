import { createTestLibrary } from "@typespec/compiler/testing";

export const HttpClientGeneratorCoreTestLibrary = createTestLibrary({
  name: "@typespec/http-client-generator-core",
  packageRoot: new URL("../../../", import.meta.url).href,
});
