import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const HttpServerJavaScriptTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-server-javascript",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
