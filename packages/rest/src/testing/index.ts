import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const RestTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/rest",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/rest" },
    { realDir: "lib", pattern: "*.cadl", virtualPath: "./node_modules/@cadl-lang/rest/lib" },
    {
      realDir: "dist/src",
      pattern: "**/*.js",
      virtualPath: "./node_modules/@cadl-lang/rest/dist/src",
    },
  ],
};
