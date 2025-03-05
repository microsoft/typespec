import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve } from "path/posix";
import type { InitTemplate } from "../src/init/init-template.js";
import { localDir, packageRoot } from "./helpers.js";

const pkgJson = JSON.parse(
  (await readFile(resolve(packageRoot, "package.json"))).toString("utf-8"),
);
const minCompilerVersion = pkgJson.version;

const builtInTemplates: Record<string, InitTemplate> = {
  rest: {
    title: "Generic REST API",
    description: "Create a project representing a generic REST API service.",
    compilerVersion: minCompilerVersion,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi", "@typespec/openapi3"],
    emitters: {
      "@typespec/openapi3": {
        selected: true,
        label: "OpenAPI 3.1 document",
        options: {
          "emitter-output-dir": "{output-dir}/schema",
          "openapi-versions": ["3.1.0"],
        },
      },
      "@typespec/http-client-csharp": {
        label: "C# client",
        options: {
          "emitter-output-dir": "{output-dir}/clients/csharp",
        },
      },
      "@typespec/http-client-java": {
        label: "Java client",
        options: {
          "emitter-output-dir": "{output-dir}/clients/java",
        },
      },
      "@typespec/http-client-js": {
        label: "JavaScript client",
        options: {
          "emitter-output-dir": "{output-dir}/clients/js",
        },
      },
      "@typespec/http-client-python": {
        label: "Python client",
        options: {
          "emitter-output-dir": "{output-dir}/clients/python",
        },
      },
      "@typespec/http-server-csharp": {
        label: "C# server stubs",
        options: {
          "emitter-output-dir": "{output-dir}/server/generated",
        },
      },
      "@typespec/http-server-js": {
        description: "JavaScript server stubs",
        options: {
          "emitter-output-dir": "{output-dir}/server",
        },
      },
    },
    files: [...(await localDir("rest"))],
  },
  "library-ts": {
    title: "TypeSpec library",
    description: "Build your own TypeSpec library with custom types, decorators or linters.",
    compilerVersion: minCompilerVersion,
    libraries: [],
    files: [
      { destination: "main.tsp", skipGeneration: true },
      { destination: "tspconfig.yaml", skipGeneration: true },
      ...(await localDir("library-ts")),
    ],
  },
  "emitter-ts": {
    title: "TypeSpec emitter",
    description: "Create a new package that emits artifacts from TypeSpec.",
    compilerVersion: minCompilerVersion,
    libraries: [],
    files: [
      { destination: "main.tsp", skipGeneration: true },
      { destination: "tspconfig.yaml", skipGeneration: true },
      ...(await localDir("emitter-ts")),
    ],
  },
};

const distDir = resolve(packageRoot, "dist");
await mkdir(distDir, { recursive: true });
await writeFile(
  resolve(packageRoot, "templates", "scaffolding.json"),
  JSON.stringify(builtInTemplates, null, 2),
);
