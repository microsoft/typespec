import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPITestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/openapi",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/openapi" },
    { realDir: "lib", pattern: "*.cadl", virtualPath: "./node_modules/@cadl-lang/openapi/lib" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/openapi/dist/src",
    },
  ],
};
