import {
  createTestLibrary,
  findTestPackageRoot,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

<<<<<<< HEAD:packages/compiler/templates/__snapshots__/library-ts/src/testing/index.ts
export const LibraryTsTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "library-ts",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
=======
export const TestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "{{name}}",
  packageRoot: await findTestPackageRoot(import.meta.url),
>>>>>>> 563df8bd2a301b428075b05536e5e253a6f964d1:packages/compiler/templates/emitter-ts/src/testing/index.ts
});
