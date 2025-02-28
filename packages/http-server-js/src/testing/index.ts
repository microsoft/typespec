import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const HttpServerJavaScriptTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-server-js",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
