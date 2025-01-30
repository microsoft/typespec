import type { TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const GraphqlTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/graphql",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
