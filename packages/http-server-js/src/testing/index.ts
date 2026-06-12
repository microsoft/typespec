import {
  TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

/** @deprecated Use `createTester` from `@typespec/compiler/testing` instead */
export const HttpServerJavaScriptTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-server-js",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
