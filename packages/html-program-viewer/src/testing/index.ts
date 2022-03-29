import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const OpenAPI3TestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/openapi3",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/openapi3" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/openapi3/dist/src",
    },
  ],
};
