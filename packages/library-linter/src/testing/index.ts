import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const LibraryLinterTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/library-linter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@cadl-lang/library-linter",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/library-linter/dist/src",
    },
  ],
};
