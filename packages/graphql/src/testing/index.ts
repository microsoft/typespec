import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const GraphqlTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "graphql",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
