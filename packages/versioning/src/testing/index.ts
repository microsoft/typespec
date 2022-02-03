import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const VersioningTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/versioning",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/versioning" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/versioning/dist/src",
    },
    {
      realDir: "lib",
      pattern: "*.cadl",
      virtualPath: "./node_modules/@cadl-lang/versioning/lib",
    },
  ],
};
