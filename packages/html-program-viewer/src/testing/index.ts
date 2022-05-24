import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const ProgramViewerTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/html-program-viewer",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@cadl-lang/html-program-viewer",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/html-program-viewer/dist/src",
    },
  ],
};
